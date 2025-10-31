// app/auth/confirm/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  if (!code) {
    console.warn('Missing code in confirmation link');
    return NextResponse.redirect(new URL('/', req.url)); // fallback if no code
  }

  const supabase = await createClient();
  const { data, error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error('exchangeCodeForSession error:', error.message);
    // Redirect to homepage if Supabase returns an error (e.g. expired link)
    return NextResponse.redirect(new URL('/', req.url));
  }

  // ✅ Success: user is now signed in and cookies are set
  console.log('✅ Email confirmed successfully for user:', data.user?.email);

  // 👇 Redirect to your main user dashboard
  return NextResponse.redirect(new URL('/home', req.url));
}
