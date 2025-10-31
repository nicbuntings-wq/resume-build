// app/auth/confirm/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    return NextResponse.redirect(new URL('/auth/login?error=missing_code', req.url));
  }

  const supabase = await createClient();

  // Exchange the code for a session
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('exchangeCodeForSession error:', error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }

  // ✅ Success: cookies are set and user is signed in
  return NextResponse.redirect(new URL('/home', req.url));
}
