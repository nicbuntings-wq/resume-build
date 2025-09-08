import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import Link from "next/link";
import { Mail } from "lucide-react";

interface FooterProps {
  variant?: "fixed" | "static";
}

export function Footer({ variant = "fixed" }: FooterProps) {
  const year = new Date().getFullYear();

  return (
    <footer
      className={`h-auto md:h-14 w-full border-t border-black/30 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 z-50 ${
        variant === "fixed" ? "fixed bottom-0 left-0 right-0" : "static"
      }`}
    >
      <div className="container py-4 md:py-0 flex flex-col md:flex-row h-auto md:h-14 items-center justify-between gap-4 md:gap-0">
        {/* Left: brand */}
        <div className="flex items-center gap-2 md:gap-4">
          <p className="text-sm text-muted-foreground">Cyme.AI {year}</p>
        </div>

        {/* Right: support + legal dropdown */}
        <nav className="flex items-center gap-4">
          <Link
            href="mailto:support@cyme.ai"
            className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline"
          >
            <Mail className="h-4 w-4" />
            <span>Contact Support</span>
          </Link>

          {/* Dropdown for legal links */}
          <DropdownMenu>
            <DropdownMenuTrigger className="text-sm text-muted-foreground hover:text-foreground transition-colors underline-offset-4 hover:underline">
              More
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="bg-background border rounded-md p-1">
              <DropdownMenuItem asChild>
                <Link href="/terms.html">Terms of Use</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/privacy.html">Privacy Policy</Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/licenses.html">Licenses</Link>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </nav>
      </div>
    </footer>
  );
}
