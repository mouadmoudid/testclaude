import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/middleware';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    const sortBy = searchParams.get('sortBy') || 'ordersMonth';
    const sortOrder = searchParams.get('sortOrder') || 'desc';
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Get current month start date
    const currentMonthStart = new Date(new Date().getFullYear(), new Date().getMonth(), 1);

    // Build the order by clause based on sortBy parameter
    let orderBy: any = {};
    switch (sortBy) {
      case 'ordersMonth':
        orderBy = { totalOrders: sortOrder as 'asc' | 'desc' };
        break;
      case 'customers':
        // We'll sort by a computed field, so we'll do this in memory
        orderBy = { id: 'asc' };
        break;
      case 'revenue':
        orderBy = { totalRevenue: sortOrder as 'asc' | 'desc' };
        break;
      case 'rating':
        orderBy = { rating: sortOrder as 'asc' | 'desc' };
        break;
      default:
        orderBy = { totalOrders: 'desc' };
    }

    // Get laundries with their performance metrics
    const laundries = await prisma.laundry.findMany({
      where: {
        isActive: true
      },
      include: {
        orders: {
          select: {
            id: true,
            customerId: true,
            createdAt: true,
            finalAmount: true,
            status: true
          }
        },
        reviews: {
          select: {
            rating: true
          }
        },
        _count: {
          select: {
            orders: true,
            reviews: true
          }
        }
      },
      orderBy,
      skip,
      take: limit
    });

    // Calculate performance metrics for each laundry
    const laundryPerformance = laundries.map(laundry => {
      // This month orders
      const thisMonthOrders = laundry.orders.filter(order => 
        order.createdAt >= currentMonthStart
      );

      // Unique customers count
      const uniqueCustomers = new Set(laundry.orders.map(order => order.customerId)).size;

      // This month revenue
      const thisMonthRevenue = thisMonthOrders
        .filter(order => ['COMPLETED', 'DELIVERED'].includes(order.status))
        .reduce((sum, order) => sum + order.finalAmount, 0);

      // Average rating
      const avgRating = laundry.reviews.length > 0
        ? laundry.reviews.reduce((sum, review) => sum + review.rating, 0) / laundry.reviews.length
        : 0;

      return {
        id: laundry.id,
        name: laundry.name,
        address: laundry.address,
        city: laundry.city,
        status: laundry.status,
        ordersMonth: thisMonthOrders.length,
        customers: uniqueCustomers,
        revenue: Math.round(thisMonthRevenue * 100) / 100,
        rating: Math.round(avgRating * 10) / 10,
        totalOrders: laundry._count.orders,
        totalReviews: laundry._count.reviews,
        createdAt: laundry.createdAt
      };
    });

    // Sort by customers if needed (since we computed this field)
    if (sortBy === 'customers') {
      laundryPerformance.sort((a, b) => {
        return sortOrder === 'desc' ? b.customers - a.customers : a.customers - b.customers;
      });
    }

    // Get total count for pagination
    const totalCount = await prisma.laundry.count({
      where: {
        isActive: true
      }
    });

    const totalPages = Math.ceil(totalCount / limit);

    return NextResponse.json({
      laundries: laundryPerformance,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      }
    });

  } catch (error) {
    console.error('Laundries performance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}