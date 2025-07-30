// lib/auth-middleware.ts
import { NextRequest } from 'next/server';
import { jwtVerify } from 'jose';
import { UserRole } from '@prisma/client';

export interface AuthUser {
  id: string;
  email: string;
  name?: string;
  role: UserRole;
}

export async function verifyToken(request: NextRequest): Promise<AuthUser | null> {
  try {
    const authHeader = request.headers.get('authorization');
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7); // Remove 'Bearer ' prefix
    
    if (!token) {
      return null;
    }

    const secret = new TextEncoder().encode(
      process.env.NEXTAUTH_SECRET || 'fallback-secret-key'
    );

    const { payload } = await jwtVerify(token, secret);
    
    return {
      id: payload.sub as string,
      email: payload.email as string,
      name: payload.name as string,
      role: payload.role as UserRole
    };
  } catch (error) {
    console.error('Token verification failed:', error);
    return null;
  }
}

export function requireAuth(allowedRoles?: UserRole[]) {
  return async (request: NextRequest): Promise<{ user: AuthUser } | { error: string; status: number }> => {
    const user = await verifyToken(request);
    
    if (!user) {
      return { error: 'Unauthorized - Valid token required', status: 401 };
    }

    if (allowedRoles && !allowedRoles.includes(user.role)) {
      return { error: 'Forbidden - Insufficient permissions', status: 403 };
    }

    return { user };
  };
}