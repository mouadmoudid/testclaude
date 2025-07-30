import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/middleware';
import { OrderStatus } from '@prisma/client';

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
    
    // Query parameters
    const status = searchParams.get('status') as OrderStatus | null;
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
    const search = searchParams.get('search');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

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

    // Build where clause
    const where: any = {
      laundryId
    };

    // Filter by status
    if (status) {
      where.status = status;
    }

    // Filter by date range
    if (startDate || endDate) {
      where.createdAt = {};
      if (startDate) {
        where.createdAt.gte = new Date(startDate);
      }
      if (endDate) {
        where.createdAt.lte = new Date(endDate);
      }
    }

    // Search filter
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
      status: order.status,
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      finalAmount: order.finalAmount,
      paymentMethod: order.paymentMethod,
      paymentStatus: order.paymentStatus,
      address: {
        street: order.address.street,
        city: order.address.city,
        state: order.address.state,
        zipCode: order.address.zipCode
      },
      items: order.orderItems.map(item => ({
        id: item.id,
        product: item.product.name,
        category: item.product.category,
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        notes: item.notes
      })),
      notes: order.notes,
      pickupDate: order.pickupDate,
      deliveryDate: order.deliveryDate,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt
    }));

    // Get status summary
    const statusSummary = await prisma.order.groupBy({
      by: ['status'],
      where: { laundryId },
      _count: {
        status: true
      }
    });

    const statusCounts = statusSummary.reduce((acc, item) => {
      acc[item.status] = item._count.status;
      return acc;
    }, {} as Record<string, number>);

    return NextResponse.json({
      orders: formattedOrders,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      statusSummary: statusCounts
    });

  } catch (error) {
    console.error('Laundry orders error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}