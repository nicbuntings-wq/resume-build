import { type NextRequest } from 'next/server'
import { updateSession } from '@/utils/supabase/middleware'

export async function middleware(request: NextRequest) {
  return await updateSession(request)
}

export const config = {
  matcher: [
    // Run middleware on everything EXCEPT:
    // - Next.js assets, images, favicon
    // - Webhooks
    // - Public embed pages  (/embed/*)
    // - Public scorer API   (/api/public/*)
    // - Root and /blog
    // - Common static image files
    '/((?!_next/static|_next/image|favicon.ico|api/webhooks|api/public(?:/.*)?|embed(?:/.*)?|$|blog(?:/.*)?|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
}
