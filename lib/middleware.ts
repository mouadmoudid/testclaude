import { NextRequest, NextResponse } from 'next/server';
import { getToken } from 'next-auth/jwt';
import { UserRole } from '@prisma/client';

export async function authMiddleware(req: NextRequest) {
  const token = await getToken({ req, secret: process.env.NEXTAUTH_SECRET });
  
  // Check if user is authenticated
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login' },
      { status: 401 }
    );
  }

  return token;
}

export async function requireSuperAdmin(req: NextRequest) {
  const token = await authMiddleware(req);
  
  if (token instanceof NextResponse) {
    return token; // Return error response
  }

  if (token.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json(
      { error: 'Forbidden - Super Admin access required' },
      { status: 403 }
    );
  }

  return token;
}

export async function requireAdmin(req: NextRequest) {
  const token = await authMiddleware(req);
  
  if (token instanceof NextResponse) {
    return token;
  }

  if (token.role !== UserRole.ADMIN && token.role !== UserRole.SUPER_ADMIN) {
    return NextResponse.json(
      { error: 'Forbidden - Admin access required' },
      { status: 403 }
    );
  }

  return token;
}

export async function requireCustomer(req: NextRequest) {
  const token = await authMiddleware(req);
  
  if (token instanceof NextResponse) {
    return token;
  }

  if (token.role !== UserRole.CUSTOMER) {
    return NextResponse.json(
      { error: 'Forbidden - Customer access required' },
      { status: 403 }
    );
  }

  return token;
}