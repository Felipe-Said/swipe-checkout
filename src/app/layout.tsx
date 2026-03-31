import type { Metadata } from "next";
import * as React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ShopifyEmbeddedProbe } from "@/components/shopify/shopify-embedded-probe";
import { getShopifyEmbeddedApiKey } from "@/lib/shopify-embedded";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Swipe | Plataforma de Checkout SaaS",
  description: "Checkout premium para marcas de alto desempenho.",
  icons: {
    icon: "/icon.svg",
    shortcut: "/icon.svg",
    apple: "/icon.svg",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const shopifyApiKey = getShopifyEmbeddedApiKey();

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {shopifyApiKey ? (
          <>
            <meta name="shopify-api-key" content={shopifyApiKey} />
            <script src="https://cdn.shopify.com/shopifycloud/app-bridge.js" />
          </>
        ) : null}
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <ThemeProvider
          attribute="class"
          defaultTheme="system"
          enableSystem
          disableTransitionOnChange
        >
          <React.Suspense fallback={null}>
            <ShopifyEmbeddedProbe />
          </React.Suspense>
          {children}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
