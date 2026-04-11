import type { Metadata } from "next";
import * as React from "react";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
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
  const shopifyEmbeddedConfigs = getShopifyEmbeddedAppConfigs()
  const embeddedApiKeys = Object.fromEntries(
    shopifyEmbeddedConfigs.map((config) => [config.slot, config.apiKey])
  )

  return (
    <html lang="pt-BR" suppressHydrationWarning>
      <head>
        {shopifyEmbeddedConfigs.length > 0 ? (
          <>
            <script
              dangerouslySetInnerHTML={{
                __html: `
                  (function () {
                    var pathname = window.location.pathname || "/";
                    var params = new URLSearchParams(window.location.search);
                    var shouldLoadEmbedded =
                      pathname === "/login" ||
                      pathname === "/signup" ||
                      pathname === "/forgot-password" ||
                      pathname === "/" ||
                      pathname === "/app" ||
                      pathname.indexOf("/app/") === 0 ||
                      params.get("embedded") === "1" ||
                      Boolean(params.get("host")) ||
                      Boolean(params.get("shopify_app"));

                    if (pathname.indexOf("/checkout/") === 0) {
                      shouldLoadEmbedded = false;
                    }

                    if (!shouldLoadEmbedded) {
                      return;
                    }

                    var slot = params.get("shopify_app") === "2" ? "2" : "1";
                    var apiKeys = ${JSON.stringify(embeddedApiKeys)};
                    var apiKey = apiKeys[slot] || apiKeys["1"] || "";
                    if (!apiKey) return;
                    var meta = document.createElement("meta");
                    meta.name = "shopify-api-key";
                    meta.content = apiKey;
                    document.head.appendChild(meta);

                    if (!document.querySelector('script[data-shopify-app-bridge="true"]')) {
                      var script = document.createElement("script");
                      script.src = "https://cdn.shopify.com/shopifycloud/app-bridge.js";
                      script.setAttribute("data-shopify-app-bridge", "true");
                      document.head.appendChild(script);
                    }
                  })();
                `,
              }}
            />
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
