import { NextResponse } from 'next/server';
import { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const u = request.nextUrl.clone();
  const p = u.pathname;

  const oldRoutes = [
    '/game-design',
    '/aura-champions',
  ];

  if (oldRoutes.includes(p)) {
    const url = request.nextUrl.clone();
    url.pathname = '/gaming/aura-champions';
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ['/game-design', '/aura-champions'],
};
