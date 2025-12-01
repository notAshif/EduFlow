import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from './db';
import { User } from './types';

export async function getCurrentUser(): Promise<User | null> {
  try {
    const { userId } = await auth();

    // Dev mode bypass for curl testing
    if (!userId && process.env.NODE_ENV === 'development' && process.env.DEV_MODE_BYPASS === 'true') {
      const devUser = await prisma.user.findFirst({
        include: { organization: true },
      });
      if (devUser) {
        console.warn('⚠️ Authentication bypassed in DEV mode. Using first found user.');
        return devUser as User;
      }
    }

    if (!userId) return null;

    let user = (await prisma.user.findUnique({
      where: { clerkId: userId },
      include: { organization: true },
    })) as User | null;

    if (!user) {
      const client = await clerkClient();
      const clerkUser = await client.users.getUser(userId);

      const firstName = clerkUser.firstName ?? undefined;
      const lastName = clerkUser.lastName ?? undefined;
      const email =
        clerkUser.emailAddresses?.[0]?.emailAddress ??
        clerkUser.primaryEmailAddress?.emailAddress;

      if (!email) throw new Error('No email found');

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
    }

    return user;
  } catch (error) {
    console.error('Error getting current user:', error);
    return null;
  }
}

export async function requireAuth(): Promise<User> {
  const user = await getCurrentUser();
  if (!user) throw new Error('Authentication required');
  return user;
}