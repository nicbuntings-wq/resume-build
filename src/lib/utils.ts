import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

export function getGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

export function sanitizeUnknownStrings<T>(data: T): T {
  if (typeof data === 'string') {
    return (data === '<UNKNOWN>' ? '' : data) as T;
  }
  if (Array.isArray(data)) {
    return data.map(item => sanitizeUnknownStrings(item)) as T;
  }
  if (typeof data === 'object' && data !== null) {
    return Object.fromEntries(
      Object.entries(data).map(([key, value]) => [key, sanitizeUnknownStrings(value)])
    ) as T;
  }
  return data;
}

// 🔽 Add helper here at the bottom
export function normalizeWorkLocation(
  loc: string | null | undefined
): "remote" | "in_person" | "hybrid" | null | undefined {
  if (!loc) return loc;

  const val = loc.toLowerCase();
  if (val.includes("remote")) return "remote";
  if (val.includes("hybrid")) return "hybrid";
  if (
    val.includes("in-person") ||
    val.includes("in_person") ||
    val.includes("office")
  ) {
    return "in_person";
  }

  return undefined; // fallback so TS doesn’t complain
}
