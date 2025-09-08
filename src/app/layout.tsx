// src/app/layout.tsx
import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/footer";
import { AppHeader } from "@/components/layout/app-header";
import { createClient } from "@/utils/supabase/server";
import { getSubscriptionStatus } from "@/utils/actions/stripe/actions";
import type { Metadata } from "next";
import { Analytics } from "@vercel/analytics/react";
import Link from "next/link";
import { cookies } from "next/headers";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  metadataBase: new URL("https://cyme.ai"),
  title: {
    default: "Cyme.AI — AI-Powered Resume Builder",
    template: "%s | Cyme.AI",
  },
  description:
    "Create tailored, ATS-optimized resumes powered by AI. Land your dream job with personalized resume optimization.",
  applicationName: "Cyme.AI",
  keywords: [
    "resume builder",
    "AI resume",
    "ATS optimization",
    "tech jobs",
    "career tools",
    "job application",
  ],
  authors: [{ name: "Cyme.AI" }],
  creator: "Cyme.AI",
  publisher: "Cyme.AI",
  formatDetection: { email: false, address: false, telephone: false },
  icons: {
    icon: "/favicon.ico",
    shortcut: "/favicon-16x16.png",
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    type: "website",
    siteName: "Cyme.AI",
    title: "Cyme.AI — AI-Powered Resume Builder",
    description:
      "Create tailored, ATS-optimized resumes powered by AI. Land your dream job with personalized resume optimization.",
    images: [
      {
        url: "/og.webp",
        width: 1200,
        height: 630,
        alt: "Cyme.AI — AI Resume Builder",
      },
    ],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
};

export default async function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // detect impersonation via cookie
  const cookieStore = await cookies();
  const isImpersonating = cookieStore.get("is_impersonating")?.value === "true";

  let showUpgradeButton = false;
  let isProPlan = false;

  if (user) {
    try {
      const profile = await getSubscriptionStatus();
      const isPro =
        profile?.subscription_plan?.toLowerCase()?.includes("pro") &&
        profile?.subscription_status !== "canceled";
      isProPlan = !!isPro;
      showUpgradeButton = !isPro;
    } catch {
      showUpgradeButton = true;
      isProPlan = false;
    }
  }

  return (
    <html lang="en">
      <body className={inter.className}>
        {isImpersonating && user && (
          <div className="bg-amber-500 text-white text-center text-sm py-2">
            Impersonating&nbsp;
            <span className="font-semibold">
              {user.email ?? user.id}
            </span>
            .&nbsp;
            <Link href="/stop-impersonation" className="underline font-medium">
              Stop impersonating
            </Link>
          </div>
        )}

        <div className="relative min-h-screen h-screen flex flex-col">
          {user && (
            <AppHeader
              showUpgradeButton={showUpgradeButton}
              isProPlan={isProPlan}
            />
          )}

          <main className="py-14 h-full">
            {children}
            <Analytics />
          </main>

          {user && <Footer />}
        </div>

        <Toaster
          richColors
          position="top-right"
          closeButton
          toastOptions={{
            style: {
              fontSize: "1rem",
              padding: "16px",
              minWidth: "400px",
              maxWidth: "500px",
            },
          }}
        />
      </body>
    </html>
  );
}
