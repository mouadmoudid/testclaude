import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/auth-utils';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    // Get aggregated metrics
    const [
      totalLaundries,
      totalUsers,
      totalOrders,
      totalRevenue,
      activeOrders,
      thisMonthOrders,
      thisMonthRevenue
    ] = await Promise.all([
      // Total laundries
      prisma.laundry.count({
        where: { isActive: true }
      }),
      
      // Total users (excluding super admins)
      prisma.user.count({
        where: { 
          isActive: true,
          role: { not: 'SUPER_ADMIN' }
        }
      }),
      
      // Total orders
      prisma.order.count(),
      
      // Total platform revenue
      prisma.order.aggregate({
        _sum: { finalAmount: true },
        where: {
          status: { in: ['COMPLETED', 'DELIVERED'] }
        }
      }),
      
      // Active orders (in progress)
      prisma.order.count({
        where: {
          status: { in: ['PENDING', 'CONFIRMED', 'IN_PROGRESS', 'READY_FOR_PICKUP', 'OUT_FOR_DELIVERY'] }
        }
      }),
      
      // This month orders
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      // This month revenue
      prisma.order.aggregate({
        _sum: { finalAmount: true },
        where: {
          status: { in: ['COMPLETED', 'DELIVERED'] },
          createdAt: {
            gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    // Calculate growth percentages (comparing with last month)
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);
    
    const [lastMonthOrders, lastMonthRevenue] = await Promise.all([
      prisma.order.count({
        where: {
          createdAt: {
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      }),
      
      prisma.order.aggregate({
        _sum: { finalAmount: true },
        where: {
          status: { in: ['COMPLETED', 'DELIVERED'] },
          createdAt: {
            gte: new Date(lastMonth.getFullYear(), lastMonth.getMonth(), 1),
            lt: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
          }
        }
      })
    ]);

    const orderGrowth = lastMonthOrders > 0 
      ? ((thisMonthOrders - lastMonthOrders) / lastMonthOrders) * 100 
      : 0;
      
    const revenueGrowth = (lastMonthRevenue._sum.finalAmount || 0) > 0 
      ? (((thisMonthRevenue._sum.finalAmount || 0) - (lastMonthRevenue._sum.finalAmount || 0)) / (lastMonthRevenue._sum.finalAmount || 0)) * 100 
      : 0;

    const dashboardData = {
      totalLaundries,
      totalUsers,
      totalOrders,
      platformRevenue: totalRevenue._sum.finalAmount || 0,
      activeOrders,
      thisMonth: {
        orders: thisMonthOrders,
        revenue: thisMonthRevenue._sum.finalAmount || 0,
        orderGrowth: Math.round(orderGrowth * 100) / 100,
        revenueGrowth: Math.round(revenueGrowth * 100) / 100
      }
    };

    return NextResponse.json(dashboardData);

  } catch (error) {
    console.error('Dashboard overview error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}