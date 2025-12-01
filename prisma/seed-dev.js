const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

async function main() {
    const org = await prisma.organization.create({
        data: {
            name: 'Dev Organization',
            plan: 'pro',
        },
    });

    const user = await prisma.user.create({
        data: {
            clerkId: 'dev_user_123',
            email: 'dev@example.com',
            firstName: 'Dev',
            lastName: 'User',
            organizationId: org.id,
            role: 'admin',
        },
    });

    console.log('Created dev user:', user);
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await prisma.$disconnect();
    });
