// app/auth/confirm/route.ts
export const runtime = 'nodejs';         // must be Node to set cookies
export const dynamic = 'force-dynamic';  // always run fresh

import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createRouteHandlerClient } from "@supabase/auth-helpers-nextjs";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const code = searchParams.get("code");

  // No code means Supabase didn't append it or link reused/expired
  if (!code) {
    return NextResponse.redirect(new URL("/auth/login?error=missing_code", req.url));
  }

  const supabase = createRouteHandlerClient({ cookies });
  const { error } = await supabase.auth.exchangeCodeForSession(code);

  if (error) {
    console.error("Exchange error:", error);
    return NextResponse.redirect(
      new URL(`/auth/login?error=${encodeURIComponent(error.message)}`, req.url)
    );
  }

  // 🎉 Success — session cookies are now set on cyme.ai
  return NextResponse.redirect(new URL("/home", req.url));
}
