import type { Metadata, Viewport } from "next";
import { Fraunces, Manrope } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";

const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  axes: ["opsz", "SOFT", "WONK"],
  weight: "variable",
});

const manrope = Manrope({
  variable: "--font-manrope",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Verclara",
  description: "Client, lead, and task management for Audax Ventures.",
  icons: {
    // Versioned so browsers that cached an older favicon under this exact
    // URL (favicons are cached unusually aggressively, especially on the
    // marketing subdomain) are forced to refetch instead of holding onto it.
    icon: "/favicon.png?v=3",
  },
};

export const viewport: Viewport = {
  themeColor: "#101d33",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="en"
      className={`${fraunces.variable} ${manrope.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-cream-50 text-navy-900">
        {children}
        <Analytics />
      </body>
    </html>
  );
}
