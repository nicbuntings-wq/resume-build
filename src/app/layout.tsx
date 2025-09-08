import { Inter } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";
import { Footer } from "@/components/layout/footer";
import { AppHeader } from "@/components/layout/app-header";
import { createClient } from "@/utils/supabase/server";
import { getSubscriptionStatus } from '@/utils/actions/stripe/actions';
import { Metadata } from "next";
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
