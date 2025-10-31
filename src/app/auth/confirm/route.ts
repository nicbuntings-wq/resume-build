// app/auth/confirm/route.ts
export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { createClient } from '@/utils/supabase/server';

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get('code');

  // ⛔ If no code provided, go home instead of showing an error
  if (!code) {
    console.warn('Missing code in confirmation link');
    return NextResponse.redirect(new URL('/', req.url)); // 👈 Redirect to homepage
  }

  const supabase = await createClient();
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  // ⛔ If Supabase throws an error, still go home instead of /auth/login
  if (error) {
    console.error('exchangeCodeForSession error:', error.message);
    return NextResponse.redirect(new URL('/', req.url)); // 👈 Redirect to homepage
  }

  // ✅ Success: user is signed in, cookies set
  console.log('✅ Email confirmed successfully');
  return NextResponse.redirect(new URL('/home', req.url)); // 👈 Redirect to dashboard/home
}
