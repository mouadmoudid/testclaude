import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { requireSuperAdmin } from '@/lib/middleware';

export async function GET(
  request: NextRequest,
  { params }: { params: { orderId: string } }
) {
  try {
    // Check authentication and authorization
    const authResult = await requireSuperAdmin(request);
    if (authResult instanceof NextResponse) {
      return authResult;
    }

    const { orderId } = params;

    if (!orderId) {
      return NextResponse.json(
        { error: 'Order ID is required' },
        { status: 400 }
      );
    }

    // Get comprehensive order details
    const order = await prisma.order.findUnique({
      where: { id: orderId },
      include: {
        customer: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            createdAt: true
          }
        },
        laundry: {
          select: {
            id: true,
            name: true,
            email: true,
            phone: true,
            address: true,
            city: true,
            state: true,
            zipCode: true
          }
        },
        address: {
          select: {
            street: true,
            city: true,
            state: true,
            zipCode: true,
            country: true,
            instructions: true
          }
        },
        orderItems: {
          include: {
            product: {
              select: {
                id: true,
                name: true,
                description: true,
                category: true,
                price: true
              }
            }
          }
        },
        activities: {
          include: {
            user: {
              select: {
                name: true,
                role: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        }
      }
    });

    if (!order) {
      return NextResponse.json(
        { error: 'Order not found' },
        { status: 404 }
      );
    }

    // Format the comprehensive order details
    const orderDetails = {
      // Basic order information
      id: order.id,
      orderNumber: order.orderNumber,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethod: order.paymentMethod,
      
      // Financial details
      totalAmount: order.totalAmount,
      deliveryFee: order.deliveryFee,
      discount: order.discount,
      finalAmount: order.finalAmount,
      
      // Customer information
      customer: {
        id: order.customer.id,
        name: order.customer.name,
        email: order.customer.email,
        phone: order.customer.phone,
        memberSince: order.customer.createdAt
      },
      
      // Laundry information
      laundry: {
        id: order.laundry.id,
        name: order.laundry.name,
        email: order.laundry.email,
        phone: order.laundry.phone,
        address: order.laundry.address,
        city: order.laundry.city,
        state: order.laundry.state,
        zipCode: order.laundry.zipCode
      },
      
      // Delivery address
      deliveryAddress: {
        street: order.address.street,
        city: order.address.city,
        state: order.address.state,
        zipCode: order.address.zipCode,
        country: order.address.country,
        instructions: order.address.instructions
      },
      
      // Order items
      items: order.orderItems.map(item => ({
        id: item.id,
        product: {
          id: item.product.id,
          name: item.product.name,
          description: item.product.description,
          category: item.product.category,
          unitPrice: item.product.price
        },
        quantity: item.quantity,
        price: item.price,
        total: item.total,
        notes: item.notes
      })),
      
      // Dates and notes
      notes: order.notes,
      pickupDate: order.pickupDate,
      deliveryDate: order.deliveryDate,
      estimatedDelivery: order.estimatedDelivery,
      createdAt: order.createdAt,
      updatedAt: order.updatedAt,
      
      // Activity timeline
      timeline: order.activities.map(activity => ({
        id: activity.id,
        type: activity.type,
        title: activity.title,
        description: activity.description,
        user: activity.user ? {
          name: activity.user.name,
          role: activity.user.role
        } : null,
        metadata: activity.metadata,
        createdAt: activity.createdAt
      }))
    };

    return NextResponse.json(orderDetails);

  } catch (error) {
    console.error('Order details error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}