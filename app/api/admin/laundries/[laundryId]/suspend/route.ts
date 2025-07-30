import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/middleware';
import { LaundryStatus } from '@prisma/client';

export async function POST(
  request: NextRequest,
  { params }: { params: { laundryId: string } }
) {
  try {
    // Check authentication and authorization
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { laundryId } = params;
    const body = await request.json();
    const { reason } = body;

    if (!laundryId) {
      return NextResponse.json(
        { error: 'Laundry ID is required' },
        { status: 400 }
      );
    }

    // Validate the laundry exists
    const existingLaundry = await prisma.laundry.findUnique({
      where: { id: laundryId },
      include: {
        owner: {
          select: {
            name: true,
            email: true
          }
        }
      }
    });

    if (!existingLaundry) {
      return NextResponse.json(
        { error: 'Laundry not found' },
        { status: 404 }
      );
    }

    // Check if already suspended
    if (existingLaundry.status === LaundryStatus.SUSPENDED) {
      return NextResponse.json(
        { error: 'Laundry is already suspended' },
        { status: 400 }
      );
    }

    // Suspend the laundry
    const suspendedLaundry = await prisma.laundry.update({
      where: { id: laundryId },
      data: {
        status: LaundryStatus.SUSPENDED,
        isActive: false,
        updatedAt: new Date()
      }
    });

    // Cancel all pending orders for this laundry
    await prisma.order.updateMany({
      where: {
        laundryId,
        status: { in: ['PENDING', 'CONFIRMED'] }
      },
      data: {
        status: 'CANCELED',
        updatedAt: new Date()
      }
    });

    // Log suspension activity
    await prisma.activity.create({
      data: {
        type: 'LAUNDRY_SUSPENDED',
        title: 'Laundry Suspended',
        description: `Laundry "${existingLaundry.name}" has been suspended. Reason: ${reason || 'No reason provided'}`,
        laundryId: laundryId,
        userId: authResult.sub,
        metadata: {
          reason,
          suspendedBy: authResult.sub,
          suspendedAt: new Date().toISOString(),
          previousStatus: existingLaundry.status
        }
      }
    });

    // TODO: Send notification email to laundry owner
    // This would typically be handled by an email service
    console.log(`Laundry suspended: ${existingLaundry.name} (${existingLaundry.owner.email})`);

    return NextResponse.json({
      message: 'Laundry suspended successfully',
      laundry: {
        id: suspendedLaundry.id,
        name: suspendedLaundry.name,
        status: suspendedLaundry.status,
        isActive: suspendedLaundry.isActive,
        suspendedAt: suspendedLaundry.updatedAt
      }
    });

  } catch (error) {
    console.error('Suspend laundry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}