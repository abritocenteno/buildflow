import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

import { ConditionalClerkProvider } from "@/components/ConditionalClerkProvider";
import ConvexClientProvider from "@/components/ConvexClientProvider";
import { ThemeProvider } from "@/components/ThemeProvider";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Arcocen — Construction Management Platform",
  description: "The complete project management platform for contractors and construction businesses.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `
  (function() {
    try {
      var d = localStorage.getItem('theme');
      var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
      if (d === 'dark' || (d === null && prefersDark)) document.documentElement.classList.add('dark');
    } catch(e) {}
  })();
` }} />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider>
          <ConditionalClerkProvider>
            <ConvexClientProvider>{children}</ConvexClientProvider>
          </ConditionalClerkProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
