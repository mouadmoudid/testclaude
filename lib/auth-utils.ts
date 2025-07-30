import { NextRequest, NextResponse } from 'next/server';
import { jwtVerify } from 'jose';
import { UserRole } from '@prisma/client';

export async function getAuthToken(req: NextRequest) {
  try {
    // Try to get token from Authorization header first
    const authHeader = req.headers.get('authorization');
    let token = authHeader?.replace('Bearer ', '');
    
    // If no authorization header, try cookie
    if (!token) {
      token = req.cookies.get('auth-token')?.value;
    }

    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(process.env.NEXTAUTH_SECRET || 'fallback-secret');
    const { payload } = await jwtVerify(token, secret);
    
    return payload;
  } catch (error) {
    console.error('Token verification error:', error);
    return null;
  }
}

export async function requireAuth(req: NextRequest) {
  const token = await getAuthToken(req);
  
  if (!token) {
    return NextResponse.json(
      { error: 'Unauthorized - Please login first' },
      { status: 401 }
    );
  }

  return token;
}

export async function requireSuperAdmin(req: NextRequest) {
  const token = await requireAuth(req);
  
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