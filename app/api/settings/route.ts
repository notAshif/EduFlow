// app/api/settings/route.ts
import { NextRequest, NextResponse } from 'next/server'
import { getCurrentUser } from '@/lib/auth'
import { prisma } from '@/lib/db'

// GET - Fetch user and organization settings
export async function GET() {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        // Get user with organization
        const userData = await prisma.user.findUnique({
            where: { id: user.id },
            include: {
                organization: true,
            },
        })

        if (!userData) {
            return NextResponse.json(
                { error: 'User not found' },
                { status: 404 }
            )
        }

        return NextResponse.json({
            user: {
                id: userData.id,
                clerkId: userData.clerkId,
                email: userData.email,
                firstName: userData.firstName,
                lastName: userData.lastName,
                role: userData.role,
                createdAt: userData.createdAt,
            },
            organization: {
                id: userData.organization.id,
                name: userData.organization.name,
                plan: userData.organization.plan,
                createdAt: userData.organization.createdAt,
            },
        })
    } catch (error) {
        console.error('[SETTINGS] Error fetching:', error)
        return NextResponse.json(
            { error: 'Failed to fetch settings' },
            { status: 500 }
        )
    }
}

// PATCH - Update user settings
export async function PATCH(request: NextRequest) {
    try {
        const user = await getCurrentUser()

        if (!user) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            )
        }

        const body = await request.json()
        const { firstName, lastName, organizationName } = body

        // Update user
        const updatedUser = await prisma.user.update({
            where: { id: user.id },
            data: {
                ...(firstName !== undefined && { firstName }),
                ...(lastName !== undefined && { lastName }),
            },
        })

        // Update organization if name provided and user has permission
        if (organizationName && user.role === 'admin') {
            await prisma.organization.update({
                where: { id: user.organizationId },
                data: { name: organizationName },
            })
        }

        return NextResponse.json({
            success: true,
            user: {
                id: updatedUser.id,
                email: updatedUser.email,
                firstName: updatedUser.firstName,
                lastName: updatedUser.lastName,
                role: updatedUser.role,
            },
        })
    } catch (error) {
        console.error('[SETTINGS] Error updating:', error)
        return NextResponse.json(
            { error: 'Failed to update settings' },
            { status: 500 }
        )
    }
}
