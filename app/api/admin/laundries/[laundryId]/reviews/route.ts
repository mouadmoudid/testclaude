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
    
    // Query parameters
    const rating = searchParams.get('rating');
    const startDate = searchParams.get('startDate');
    const endDate = searchParams.get('endDate');
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
      laundryId,
      isVisible: true
    };

    // Filter by rating
    if (rating) {
      where.rating = parseInt(rating);
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

    // Get reviews with pagination
    const [reviews, totalCount] = await Promise.all([
      prisma.review.findMany({
        where,
        include: {
          customer: {
            select: {
              id: true,
              name: true,
              email: true
            }
          }
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit
      }),
      
      prisma.review.count({ where })
    ]);

    const totalPages = Math.ceil(totalCount / limit);

    // Format reviews data
    const formattedReviews = reviews.map(review => ({
      id: review.id,
      rating: review.rating,
      comment: review.comment,
      customer: {
        id: review.customer.id,
        name: review.customer.name,
        email: review.customer.email
      },
      isVisible: review.isVisible,
      createdAt: review.createdAt,
      updatedAt: review.updatedAt
    }));

    // Get rating distribution
    const ratingDistribution = await prisma.review.groupBy({
      by: ['rating'],
      where: { laundryId, isVisible: true },
      _count: {
        rating: true
      },
      orderBy: {
        rating: 'desc'
      }
    });

    const ratingCounts = ratingDistribution.reduce((acc, item) => {
      acc[item.rating] = item._count.rating;
      return acc;
    }, {} as Record<number, number>);

    // Fill in missing ratings with 0 count
    for (let i = 1; i <= 5; i++) {
      if (!ratingCounts[i]) {
        ratingCounts[i] = 0;
      }
    }

    // Calculate average rating and total reviews
    const ratingStats = await prisma.review.aggregate({
      where: { laundryId, isVisible: true },
      _avg: { rating: true },
      _count: { rating: true }
    });

    const reviewsData = {
      reviews: formattedReviews,
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      stats: {
        averageRating: Math.round((ratingStats._avg.rating || 0) * 10) / 10,
        totalReviews: ratingStats._count.rating,
        ratingDistribution: [
          { rating: 5, count: ratingCounts[5] || 0 },
          { rating: 4, count: ratingCounts[4] || 0 },
          { rating: 3, count: ratingCounts[3] || 0 },
          { rating: 2, count: ratingCounts[2] || 0 },
          { rating: 1, count: ratingCounts[1] || 0 }
        ]
      }
    };

    return NextResponse.json(reviewsData);

  } catch (error) {
    console.error('Laundry reviews error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}