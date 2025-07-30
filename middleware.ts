import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";
import { UserRole } from "@prisma/client";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const isAuth = !!token;
    const isAuthPage = req.nextUrl.pathname.startsWith('/auth');
    const isApiAuthRoute = req.nextUrl.pathname.startsWith('/api/auth');
    const isAdminRoute = req.nextUrl.pathname.startsWith('/api/admin');
    const isPublicApiRoute = req.nextUrl.pathname.startsWith('/api/public');

    // Allow auth routes and public API routes
    if (isApiAuthRoute || isPublicApiRoute) {
      return NextResponse.next();
    }

    // Redirect to login if not authenticated and trying to access protected routes
    if (!isAuth && !isAuthPage) {
      return NextResponse.redirect(new URL('/auth/signin', req.url));
    }

    // Redirect authenticated users away from auth pages
    if (isAuth && isAuthPage) {
      const role = token?.role as UserRole;
      
      switch (role) {
        case UserRole.SUPER_ADMIN:
          return NextResponse.redirect(new URL('/admin/dashboard', req.url));
        case UserRole.ADMIN:
          return NextResponse.redirect(new URL('/laundry/dashboard', req.url));
        case UserRole.CUSTOMER:
          return NextResponse.redirect(new URL('/customer/dashboard', req.url));
        default:
          return NextResponse.redirect(new URL('/', req.url));
      }
    }

    // Check admin routes access
    if (isAdminRoute && isAuth) {
      const role = token?.role as UserRole;
      
      if (role !== UserRole.SUPER_ADMIN) {
        return NextResponse.json(
          { error: 'Forbidden - Super Admin access required' },
          { status: 403 }
        );
      }
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      authorized: ({ token, req }) => {
        // Allow access to public routes
        if (req.nextUrl.pathname.startsWith('/api/auth') || 
            req.nextUrl.pathname.startsWith('/api/public') ||
            req.nextUrl.pathname === '/') {
          return true;
        }
        
        // Require authentication for all other routes
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    "/((?!_next/static|_next/image|favicon.ico|public/).*)",
  ],
};