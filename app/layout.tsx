import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://mail-relay.falak.me";
const iconUrl = "https://falakme.github.io/brand-assets/logos/core/icon-circular.svg";

export const metadata: Metadata = {
  title: {
    default: "Falak Mail Relay",
    template: "%s | Falak Mail Relay",
  },
  description: "A secure, reliable mail relay service with automatic fallback. Support for Brevo and NotificationAPI with comprehensive email logging and analytics.",
  keywords: [
    "mail relay",
    "email service",
    "Brevo",
    "NotificationAPI",
    "email delivery",
    "transactional email",
    "secure email",
  ],
  authors: [{ name: "Falak", url: "https://falakme.github.io" }],
  creator: "Falak",
  publisher: "Falak",
  metadataBase: new URL(siteUrl),
  alternates: {
    canonical: siteUrl,
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: siteUrl,
    siteName: "Falak Mail Relay",
    title: "Falak Mail Relay - Secure Email Service",
    description: "A secure, reliable mail relay service with automatic fallback. Support for Brevo and NotificationAPI with comprehensive email logging.",
    images: [
      {
        url: iconUrl,
        width: 1000,
        height: 1000,
        alt: "Falak Mail Relay Logo",
        type: "image/png",
      },
    ],
  },
  twitter: {
    card: "summary",
    title: "Falak Mail Relay",
    description: "A secure, reliable mail relay service with automatic fallback.",
    images: [iconUrl],
    creator: "@falakme",
  },
  icons: {
    icon: [
      { url: iconUrl, sizes: "1000x1000", type: "image/png" },
      { url: iconUrl, rel: "apple-touch-icon" },
    ],
    shortcut: iconUrl,
    apple: iconUrl,
  },
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "Falak Mail Relay",
  },
  formatDetection: {
    telephone: false,
  },
  manifest: "/manifest.json",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#000000" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-status-bar-style" content="black-translucent" />
        <meta name="apple-mobile-web-app-title" content="Falak Mail Relay" />
        <link rel="manifest" href="/manifest.json" />
        <link rel="mask-icon" href={iconUrl} color="#000000" />
      </head>
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <Providers>
          <div className="min-h-screen flex flex-col">
            {children}
          </div>
        </Providers>
        <script
          dangerouslySetInnerHTML={{
            __html: `if ('serviceWorker' in navigator) { navigator.serviceWorker.register('/sw.js'); }`,
          }}
        />
      </body>
    </html>
  );
}
