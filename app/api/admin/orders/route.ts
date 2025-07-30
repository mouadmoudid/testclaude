import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/middleware';
import { OrderStatus } from '@prisma/client';

export async function GET(request: NextRequest) {
  try {
    // Check authentication and authorization
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { searchParams } = new URL(request.url);
    
    // Query parameters
    const search = searchParams.get('search');
    const status = searchParams.get('status') as OrderStatus | null;
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    // Build where clause
    const where: any = {};

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Search filter (by order ID, customer name, or laundry name)
    if (search) {
      where.OR = [
        {
          orderNumber: {
            contains: search,
            mode: 'insensitive'
          }
        },
        {
          customer: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          customer: {
            email: {
              contains: search,
              mode: 'insensitive'
            }
          }
        },
        {
          laundry: {
            name: {
              contains: search,
              mode: 'insensitive'
            }
          }
        }
      ];
    }

    // Get orders with pagination
    const [orders, totalCount] = await Promise.all([
      prisma.order.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true,
              phone: true
            }
          },
          laundry: {
            select: {
              id: true,
              name: true,
              address: true,
              city: true,
              phone: true
            }
          },
          address: {
            select: {
              street: true,
              city: true,
              state: true,
              zipCode: true
            }
          },
          orderItems: {
            include: {
              product: {
                select: {
                  name: true,
                  category: true
                }
              }
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      
      prisma.order.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Format orders data
    const formattedOrders = orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone
      },
      laundry: {
        id: order.laundry.id,
        name: order.laundry.name,
        address: order.laundry.address,
        city: order.laundry.city,
        phone: order.laundry.phone
      },
      status: order.status,
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      finalAmount: order.finalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      deliveryAddress: {
        street: order.address.street,
        city: order.address.city,
        state: order.address.state,
        zipCode: order.address.zipCode
      },
      itemsCount: order.orderItems.length,
      items: order.orderItems.map(item => ({
        product: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        price: item.price,
        total: item.total
      })),
      notes: order.notes,
      pickupDate: order.pickupDate,
      deliveryDate: order.deliveryDate,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    // Get order statistics
    const orderStats = await prisma.order.groupBy({
      by: ['status'],
      _count: {
        status: true
      },
      _sum: {
        finalAmount: true
      }
    });

    const statusSummary = orderStats.reduce((acc, stat) => {
      acc[stat.status] = {
        count: stat._count.status,
        revenue: stat._sum.finalAmount || 0
      };
      return acc;
    }, {} as Record<string, { count: number; revenue: number }>);

    // Get today's orders count
    const todayStart = new Date();
    todayStart.setHours(0, 0, 0, 0);
    
    const todayOrders = await prisma.order.count({
      where: {
        createdAt: {
          gte: todayStart
        }
      }
    });

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statistics: {
        statusSummary,
        todayOrders,
        totalRevenue: Object.values(statusSummary).reduce((sum, stat) => sum + stat.revenue, 0)
      }
    });

  } catch (error) {
    console.error('Orders management error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}