import type { Metadata } from "next";
import { Caveat, Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const handwritten = Caveat({
  variable: "--font-handwritten",
  subsets: ["latin"],
  weight: ["500", "700"],
});

export const metadata: Metadata = {
  title: {
    default: "Scatter",
    template: "%s | Scatter",
  },
  description:
    "Scatter is a local-first visual notes board for quickly capturing, organizing, and moving ideas.",
  applicationName: "Scatter",
  keywords: ["notes", "canvas", "local-first", "productivity", "scratchpad"],
  authors: [{ name: "Scatter" }],
  openGraph: {
    title: "Scatter",
    description:
      "A local-first visual notes board for quickly capturing and connecting ideas.",
    siteName: "Scatter",
    images: [
      {
        url: "/scatter-logo.svg",
        width: 1200,
        height: 630,
        alt: "Scatter logo",
      },
    ],
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "Scatter",
    description:
      "A local-first visual notes board for quickly capturing and connecting ideas.",
    images: ["/scatter-logo.svg"],
  },
  icons: {
    icon: "/scatter-logo.svg",
    shortcut: "/scatter-logo.svg",
    apple: "/scatter-logo.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} ${handwritten.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
