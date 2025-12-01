import { NextRequest, NextResponse } from 'next/server';
import { auth, clerkClient } from '@clerk/nextjs/server';
import { prisma } from '@/lib/db';
import { z } from 'zod';

const syncSchema = z.object({
  clerkId: z.string(),
});

export async function POST(request: NextRequest) {
  try {
    const { userId } = await auth();
    if (!userId) return NextResponse.json({ ok: false, error: 'Unauthorized' }, { status: 401 });

    const body = await request.json();
    const { clerkId } = syncSchema.parse(body);

    const client = await clerkClient();
    const clerkUser = await client.users.getUser(clerkId);

    const firstName = clerkUser.firstName ?? undefined;
    const lastName = clerkUser.lastName ?? undefined;
    const email =
      clerkUser.emailAddresses?.[0]?.emailAddress ??
      clerkUser.primaryEmailAddress?.emailAddress;

    if (!email) return NextResponse.json({ ok: false, error: 'No email found in Clerk user data' }, { status: 400 });

    let user = await prisma.user.findUnique({
      where: { clerkId },
      include: { organization: true },
    });

    if (!user) {
      let organization = await prisma.organization.findFirst();
      if (!organization) {
        organization = await prisma.organization.create({
          data: { name: 'Default Organization' },
        });
      }

      user = await prisma.user.create({
        data: {
          clerkId,
          email,
          firstName,
          lastName,
          organizationId: organization.id,
        },
        include: { organization: true },
      });
    }

    return NextResponse.json({ ok: true, data: user });
  } catch (error) {
    console.error('Error syncing user:', error);
    return NextResponse.json(
      { ok: false, error: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}