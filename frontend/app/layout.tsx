import type { Metadata } from "next";
import Link from "next/link";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "BES Dashboard",
  description: "Static dashboard over the scraped BES permit-to-work archive",
};

const NAV = [
  { href: "/", label: "Overview" },
  { href: "/flow", label: "Permit lifecycle" },
  { href: "/companies", label: "Companies" },
  { href: "/staff", label: "Staff" },
  { href: "/equipment", label: "Equipment" },
];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col">
        <header className="border-b">
          <nav className="mx-auto flex max-w-7xl items-center gap-6 p-4 text-sm">
            <span className="font-semibold">BES Dashboard</span>
            {NAV.map((n) => (
              <Link
                key={n.href}
                href={n.href}
                className="text-muted-foreground hover:text-foreground"
              >
                {n.label}
              </Link>
            ))}
          </nav>
        </header>
        {children}
      </body>
    </html>
  );
}
