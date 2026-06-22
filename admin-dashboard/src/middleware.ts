import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  // If we are navigating to the login page, let it proceed
  if (request.nextUrl.pathname.startsWith('/login')) {
    return NextResponse.next();
  }

  // Check for the admin_token cookie (we'll need to set this cookie alongside localStorage in AuthContext)
  // Or check localStorage on the client side. Since this is an App Router middleware,
  // we can only access cookies. But localStorage is used currently.
  // We'll skip true strict protection here since AuthContext handles it,
  // but we can enforce a simple check if a cookie was used.
  // For now, we will just allow it to pass through to AuthContext protected routes.
  
  return NextResponse.next();
}

// See "Matching Paths" below to learn more
export const config = {
  matcher: ['/((?!api|_next/static|_next/image|favicon.ico).*)'],
};
