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

    // Get performance data for the last 12 months
    const months = [];
    const currentDate = new Date();
    
    for (let i = 11; i >= 0; i--) {
      const monthStart = new Date(currentDate.getFullYear(), currentDate.getMonth() - i, 1);
      const monthEnd = new Date(currentDate.getFullYear(), currentDate.getMonth() - i + 1, 0);
      
      months.push({
        start: monthStart,
        end: monthEnd,
        name: monthStart.toLocaleString('default', { month: 'short', year: 'numeric' })
      });
    }

    // Get monthly data
    const monthlyData = await Promise.all(
      months.map(async (month) => {
        const [orders, revenue, completedOrders, avgRating, uniqueCustomers] = await Promise.all([
          // Monthly orders count
          prisma.order.count({
            where: {
              laundryId,
              createdAt: {
                gte: month.start,
                lte: month.end
              }
            }
          }),
          
          // Monthly revenue
          prisma.order.aggregate({
            _sum: { finalAmount: true },
            where: {
              laundryId,
              status: { in: ['COMPLETED', 'DELIVERED'] },
              createdAt: {
                gte: month.start,
                lte: month.end
              }
            }
          }),
          
          // Completed orders
          prisma.order.count({
            where: {
              laundryId,
              status: { in: ['COMPLETED', 'DELIVERED'] },
              createdAt: {
                gte: month.start,
                lte: month.end
              }
            }
          }),
          
          // Average rating for the month
          prisma.review.aggregate({
            _avg: { rating: true },
            where: {
              laundryId,
              createdAt: {
                gte: month.start,
                lte: month.end
              }
            }
          }),
          
          // Unique customers for the month
          prisma.order.findMany({
            where: {
              laundryId,
              createdAt: {
                gte: month.start,
                lte: month.end
              }
            },
            select: { customerId: true },
            distinct: ['customerId']
          })
        ]);

        return {
          month: month.name,
          orders,
          revenue: Math.round((revenue._sum.finalAmount || 0) * 100) / 100,
          completedOrders,
          avgRating: Math.round((avgRating._avg.rating || 0) * 10) / 10,
          customers: uniqueCustomers.length,
          completionRate: orders > 0 ? Math.round((completedOrders / orders) * 100) : 0
        };
      })
    );

    // Get top products
    const topProducts = await prisma.orderItem.groupBy({
      by: ['productId'],
      where: {
        order: {
          laundryId,
          status: { in: ['COMPLETED', 'DELIVERED'] }
        }
      },
      _sum: {
        quantity: true,
        total: true
      },
      _count: {
        productId: true
      },
      orderBy: {
        _sum: {
          total: 'desc'
        }
      },
      take: 5
    });

    const topProductsWithDetails = await Promise.all(
      topProducts.map(async (item) => {
        const product = await prisma.product.findUnique({
          where: { id: item.productId },
          select: {
            name: true,
            category: true,
            price: true
          }
        });

        return {
          product: product?.name || 'Unknown Product',
          category: product?.category || 'Unknown',
          totalQuantity: item._sum.quantity || 0,
          totalRevenue: Math.round((item._sum.total || 0) * 100) / 100,
          orderCount: item._count.productId
        };
      })
    );

    // Calculate overall metrics
    const totalOrders = monthlyData.reduce((sum, month) => sum + month.orders, 0);
    const totalRevenue = monthlyData.reduce((sum, month) => sum + month.revenue, 0);
    const avgCompletionRate = totalOrders > 0 
      ? Math.round((monthlyData.reduce((sum, month) => sum + month.completionRate, 0) / 12) * 100) / 100
      : 0;

    // Get recent reviews with ratings
    const recentReviews = await prisma.review.findMany({
      where: { laundryId },
      include: {
        customer: {
          select: {
            name: true
          }
        }
      },
      orderBy: { createdAt: 'desc' },
      take: 10
    });

    const performanceData = {
      overview: {
        totalOrders,
        totalRevenue,
        avgCompletionRate,
        currentRating: laundry.rating
      },
      monthlyData,
      topProducts: topProductsWithDetails,
      recentReviews: recentReviews.map(review => ({
        id: review.id,
        rating: review.rating,
        comment: review.comment,
        customerName: review.customer.name,
        createdAt: review.createdAt
      }))
    };

    return NextResponse.json(performanceData);

  } catch (error) {
    console.error('Laundry performance error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}