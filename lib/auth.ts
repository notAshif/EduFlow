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

        user = (await prisma.user.create({
          data: {
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