import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Toaster } from "@/components/ui/sonner";
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
  title: "Boosting Service | Order Tracking",
  description:
    "Track your boosting order progress and manage orders from the admin panel.",
  icons: {
    icon: "/sparkles-wondrous-pack.png",
    shortcut: "/sparkles-wondrous-pack.png",
    apple: "/sparkles-wondrous-pack.png",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <link rel="icon" href="/sparkles-wondrous-pack.png" type="image/png" />
        <link rel="shortcut icon" href="/sparkles-wondrous-pack.png" type="image/png" />
        <link rel="apple-touch-icon" href="/sparkles-wondrous-pack.png" />
      </head>
      <body
        className={`${geistSans.variable} ${geistMono.variable} min-h-screen scroll-smooth bg-background text-foreground antialiased`}
      >
        {children}
        <Toaster richColors position="top-right" />
      </body>
    </html>
  );
}
