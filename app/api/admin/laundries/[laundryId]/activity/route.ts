import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/middleware';

export async function GET(
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
    const { searchParams } = new URL(request.url);
    
    const limit = parseInt(searchParams.get('limit') || '20');

    if (!laundryId) {
      return NextResponse.json(
        { error: 'Laundry ID is required' },
        { status: 400 }
      );
    }

    // Validate laundry exists
    const laundry = await prisma.laundry.findUnique({
      where: { id: laundryId }
    });

    if (!laundry) {
      return NextResponse.json(
        { error: 'Laundry not found' },
        { status: 404 }
      );
    }

    // Get recent activities for this laundry
    const activities = await prisma.activity.findMany({
      where: {
        laundryId
      },
      include: {
        user: {
          select: {
            id: true,
            name: true,
            email: true,
            role: true
          }
        },
        order: {
          select: {
            orderNumber: true,
            customer: {
              select: {
                name: true
              }
            }
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: limit
    });

    // Format activities data
    const formattedActivities = activities.map(activity => ({
      id: activity.id,
      type: activity.type,
      title: activity.title,
      description: activity.description,
      user: activity.user ? {
        id: activity.user.id,
        name: activity.user.name,
        email: activity.user.email,
        role: activity.user.role
      } : null,
      order: activity.order ? {
        orderNumber: activity.order.orderNumber,
        customerName: activity.order.customer?.name
      } : null,
      metadata: activity.metadata,
      createdAt: activity.createdAt
    }));

    // Group activities by date
    const activitiesByDate = formattedActivities.reduce((acc, activity) => {
      const date = activity.createdAt.toISOString().split('T')[0]; // YYYY-MM-DD format
      
      if (!acc[date]) {
        acc[date] = [];
      }
      
      acc[date].push(activity);
      return acc;
    }, {} as Record<string, typeof formattedActivities>);

    // Convert to array format for easier frontend consumption
    const groupedActivities = Object.entries(activitiesByDate)
      .map(([date, activities]) => ({
        date,
        activities
      }))
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    return NextResponse.json({
      activities: groupedActivities,
      totalCount: activities.length
    });

  } catch (error) {
    console.error('Laundry activity error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}