import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from './db';
import { User } from './types';

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { userId } = await auth();

    // SECURE: Only bypass if explicitly enabled AND in development
    const devBypassEnabled = process.env.DEV_MODE_BYPASS === 'true' &&
      process.env.NODE_ENV === 'development';

    if (!userId) {
      // Only attempt dev bypass if explicitly enabled
      if (devBypassEnabled) {
        console.warn('⚠️ DEV_MODE_BYPASS is enabled - bypassing authentication');

        const devUser = await prisma.user.findFirst({
          include: { organization: true },
        });

        if (devUser) {
          console.warn('⚠️ Using dev user:', devUser.email);
          return devUser as User;
        } else {
          console.error('DEV_MODE_BYPASS enabled but no users found in database');
        }
      }

      // No userId and no dev bypass = not authenticated
      console.log('No user ID found in auth context');
      return null;
    }

    // Normal authenticated flow
    let user = (await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organization: true },
    })) as User | null;

    if (!user) {
      try {
        const client = await clerkClient();
        const clerkUser = await client.users.getUser(userId);

        const firstName = clerkUser.firstName ?? undefined;
        const lastName = clerkUser.lastName ?? undefined;
        const email =
          clerkUser.emailAddresses?.[0]?.emailAddress ??
          clerkUser.primaryEmailAddress?.emailAddress;

        if (!email) {
          console.error('No email found for Clerk user:', userId);
          throw new Error('No email found');
        }

        let organization = await prisma.organization.findFirst();
        if (!organization) {
          organization = await prisma.organization.create({
            data: { name: 'Default Organization' },
          });
        }

        // Use upsert to handle race conditions and existing users
        user = (await prisma.user.upsert({
          where: { clerkId: userId },
          update: {
            email,
            firstName,
            lastName,
          },
          create: {
            clerkId: userId,
            email,
            firstName,
            lastName,
            organizationId: organization.id,
          },
          include: { organization: true },
        })) as User;
      } catch (clerkError) {
        console.error('Error fetching/creating user from Clerk:', clerkError);

        // Try to fetch the user one more time in case of race condition
        try {
          user = (await prisma.user.findUnique({
            where: { clerkId: userId },
            include: { organization: true },
          })) as User | null;
          if (user) return user;
        } catch (e) {
          // Ignore
        }

        return null;
      }
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) {
    console.error('Authentication required but no user found');
    throw new Error('Authentication required');
  }
  return user;
}

/**
 * Get Google OAuth token from Clerk for the current user
 * Requires the user to have signed in with Google OAuth
 */
export async function getGoogleOAuthToken(): Promise<string | null> {
  try {
    const { userId } = await auth();
    if (!userId) {
      console.log('[OAuth] No user ID found');
      return null;
    }

    const client = await clerkClient();

    // Get all OAuth access tokens for this user
    const oauthTokens = await client.users.getUserOauthAccessToken(userId, 'google');

    if (oauthTokens.data && oauthTokens.data.length > 0) {
      const token = oauthTokens.data[0].token;
      console.log('[OAuth] Found Google OAuth token for user');
      return token;
    }

    console.log('[OAuth] No Google OAuth token found - user may not have signed in with Google');
    return null;
  } catch (error) {
    console.error('[OAuth] Error getting Google OAuth token:', error);
    return null;
  }
}

/**
 * Get Google OAuth token for a specific user by their Clerk ID
 * Used during workflow execution when we have the organization context
 */
export async function getGoogleOAuthTokenByClerkId(clerkId: string): Promise<string | null> {
  try {
    const client = await clerkClient();

    // Get all OAuth access tokens for this user
    const oauthTokens = await client.users.getUserOauthAccessToken(clerkId, 'google');

    if (oauthTokens.data && oauthTokens.data.length > 0) {
      const token = oauthTokens.data[0].token;
      console.log('[OAuth] Found Google OAuth token for user:', clerkId);
      return token;
    }

    return null;
  } catch (error) {
    console.error('[OAuth] Error getting Google OAuth token for user:', clerkId, error);
    return null;
  }
}

/**
 * Get OAuth tokens for various providers
 */
export async function getOAuthTokens(clerkId: string): Promise<{
  google?: string;
  microsoft?: string;
  zoom?: string;
}> {
  console.log(`[OAuth] Fetching tokens for Clerk ID: ${clerkId}`);
  const tokens: { google?: string; microsoft?: string; zoom?: string } = {};

  try {
    const client = await clerkClient();

    // Try to get Google token (removed oauth_ prefix per Clerk deprecation notice)
    try {
      const googleTokens = await client.users.getUserOauthAccessToken(clerkId, 'google');
      if (googleTokens.data?.[0]?.token) {
        tokens.google = googleTokens.data[0].token;
        console.log(`[OAuth] Found Google token for ${clerkId}`);
      } else {
        console.log(`[OAuth] No Google token found in Clerk response for ${clerkId}. Data:`, JSON.stringify(googleTokens.data));
      }
    } catch (e: any) {
      console.log(`[OAuth] Error fetching Google token for ${clerkId}:`, e?.message || e);
    }

    // Try to get Microsoft token (if configured)
    try {
      const msTokens = await client.users.getUserOauthAccessToken(clerkId, 'microsoft');
      if (msTokens.data?.[0]?.token) {
        tokens.microsoft = msTokens.data[0].token;
        console.log(`[OAuth] Found Microsoft token for ${clerkId}`);
      }
    } catch (e) {
      // User hasn't connected Microsoft
    }

  } catch (error) {
    console.error('[OAuth] Error fetching OAuth tokens from Clerk:', error);
  }

  return tokens;
}