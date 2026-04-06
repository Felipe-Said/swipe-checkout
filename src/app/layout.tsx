import type { Metadata } from "next";
import * as React from "react";
import { headers } from "next/headers";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { loadSafePageByHost } from "@/app/actions/safe-page";
import { SafePagePublic } from "@/components/safe-page/safe-page-public";
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";
import { ShopifyEmbeddedProbe } from "@/components/shopify/shopify-embedded-probe";
import { getShopifyEmbeddedAppConfigs } from "@/lib/shopify-embedded";

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

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const requestHeaders = await headers()
  const host = requestHeaders.get("host") ?? ""
  const pathname = requestHeaders.get("x-swipe-pathname") ?? "/"
  const safePageResult = await loadSafePageByHost(host)
  const shopifyEmbeddedConfigs = getShopifyEmbeddedAppConfigs()
  const embeddedApiKeys = Object.fromEntries(
    shopifyEmbeddedConfigs.map((config) => [config.slot, config.apiKey])
  )
  const shouldForceSafePage = Boolean(safePageResult.safePage && pathname !== "/")

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {shopifyEmbeddedConfigs.length > 0 ? (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function () {
                    var params = new URLSearchParams(window.location.search);
                    var slot = params.get("shopify_app") === "2" ? "2" : "1";
                    var apiKeys = ${JSON.stringify(embeddedApiKeys)};
                    var apiKey = apiKeys[slot] || apiKeys["1"] || "";
                    if (!apiKey) return;
                    var meta = document.createElement("meta");
                    meta.name = "shopify-api-key";
                    meta.content = apiKey;
                    document.head.appendChild(meta);
                  })();
                `,
              }}
            />
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
          {shouldForceSafePage ? (
            <SafePagePublic
              businessName={safePageResult.safePage?.businessName || "Atelier do Sabor"}
              logoUrl={safePageResult.safePage?.logoUrl || undefined}
              members={safePageResult.safePage?.membersPreview || []}
              pathname={pathname}
            />
          ) : (
            children
          )}
          <Toaster position="top-right" />
        </ThemeProvider>
      </body>
    </html>
  );
}
