import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api/webhooks (webhook endpoints)
     * - $ (base URL / landing page)
     * - blog (blog section)
     * - auth/confirm (allow email-confirm route to run freely ✅)
     * Run on all other routes to protect them
     */
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|$|blog(?:/.*)?|auth/confirm|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
