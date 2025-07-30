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

    if (!laundryId) {
      return NextResponse.json(
        { error: 'Laundry ID is required' },
        { status: 400 }
      );
    }

    // Get comprehensive laundry details
    const laundry = await prisma.laundry.findUnique({
      where: { id: laundryId },
      include: {
        owner: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true
          }
        },
        products: {
          where: { isActive: true },
          select: {
            id: true,
            name: true,
            category: true,
            price: true
          }
        },
        orders: {
          select: {
            id: true,
            orderNumber: true,
            status: true,
            finalAmount: true,
            createdAt: true,
            customer: {
              select: {
                name: true,
                email: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5 // Recent orders
        },
        reviews: {
          select: {
            id: true,
            rating: true,
            comment: true,
            createdAt: true,
            customer: {
              select: {
                name: true
              }
            }
          },
          orderBy: { createdAt: 'desc' },
          take: 5 // Recent reviews
        },
        activities: {
          select: {
            id: true,
            type: true,
            title: true,
            description: true,
            createdAt: true
          },
          orderBy: { createdAt: 'desc' },
          take: 10 // Recent activities
        },
        _count: {
          select: {
            orders: true,
            reviews: true,
            products: true
          }
        }
      }
    });

    if (!laundry) {
      return NextResponse.json(
        { error: 'Laundry not found' },
        { status: 404 }
      );
    }

    // Calculate performance metrics
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);
    
    // Get monthly orders and revenue
    const monthlyOrders = await prisma.order.count({
      where: {
        laundryId,
        createdAt: { gte: currentMonthStart }
      }
    });

    const monthlyRevenue = await prisma.order.aggregate({
      _sum: { finalAmount: true },
      where: {
        laundryId,
        status: { in: ['COMPLETED', 'DELIVERED'] },
        createdAt: { gte: currentMonthStart }
      }
    });

    // Get unique customers
    const uniqueCustomers = await prisma.order.findMany({
      where: { laundryId },
      select: { customerId: true },
      distinct: ['customerId']
    });

    // Calculate average rating
    const avgRating = await prisma.review.aggregate({
      _avg: { rating: true },
      where: { laundryId }
    });

    // Performance summary
    const performanceSummary = {
      monthlyOrders,
      monthlyRevenue: Math.round((monthlyRevenue._sum.finalAmount || 0) * 100) / 100,
      totalCustomers: uniqueCustomers.length,
      averageRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
      totalOrders: laundry._count.orders,
      totalReviews: laundry._count.reviews,
      totalProducts: laundry._count.products
    };

    const laundryDetails = {
      id: laundry.id,
      name: laundry.name,
      description: laundry.description,
      email: laundry.email,
      phone: laundry.phone,
      address: laundry.address,
      city: laundry.city,
      state: laundry.state,
      zipCode: laundry.zipCode,
      country: laundry.country,
      status: laundry.status,
      rating: laundry.rating,
      isActive: laundry.isActive,
      operatingHours: laundry.operatingHours,
      createdAt: laundry.createdAt,
      updatedAt: laundry.updatedAt,
      owner: laundry.owner,
      products: laundry.products,
      recentOrders: laundry.orders,
      recentReviews: laundry.reviews,
      recentActivity: laundry.activities,
      performanceSummary
    };

    return NextResponse.json(laundryDetails);

  } catch (error) {
    console.error('Laundry details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PATCH(
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

    if (!laundryId) {
      return NextResponse.json(
        { error: 'Laundry ID is required' },
        { status: 400 }
      );
    }

    // Validate the laundry exists
    const existingLaundry = await prisma.laundry.findUnique({
      where: { id: laundryId }
    });

    if (!existingLaundry) {
      return NextResponse.json(
        { error: 'Laundry not found' },
        { status: 404 }
      );
    }

    // Update laundry details
    const updatedLaundry = await prisma.laundry.update({
      where: { id: laundryId },
      data: {
        name: body.name,
        description: body.description,
        email: body.email,
        phone: body.phone,
        address: body.address,
        city: body.city,
        state: body.state,
        zipCode: body.zipCode,
        country: body.country,
        operatingHours: body.operatingHours,
        status: body.status,
        isActive: body.isActive,
        updatedAt: new Date()
      }
    });

    // Log activity
    await prisma.activity.create({
      data: {
        type: 'LAUNDRY_UPDATED',
        title: 'Laundry Updated',
        description: `Laundry "${updatedLaundry.name}" details were updated by super admin`,
        laundryId: laundryId,
        userId: authResult.sub
      }
    });

    return NextResponse.json(updatedLaundry);

  } catch (error) {
    console.error('Update laundry error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}