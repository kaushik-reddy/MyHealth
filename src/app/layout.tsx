import type { Metadata, Viewport } from "next";
import { Plus_Jakarta_Sans, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "@/lib/store";

const appSans = Plus_Jakarta_Sans({
  variable: "--font-app-sans",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700", "800"],
});

const appNum = Space_Grotesk({
  variable: "--font-app-num",
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "MyHealth — Wellness Tracker",
  description:
    "Mobile-first health & fitness tracker — sugar, steps, calories and a live weight-goal projection.",
  manifest: "/manifest.webmanifest",
  applicationName: "MyHealth",
  appleWebApp: {
    capable: true,
    statusBarStyle: "black-translucent",
    title: "MyHealth",
  },
  icons: {
    icon: [
      { url: "/icons/icon-192.png", sizes: "192x192", type: "image/png" },
      { url: "/icons/icon-512.png", sizes: "512x512", type: "image/png" },
    ],
    apple: [{ url: "/icons/apple-touch-icon.png", sizes: "180x180" }],
    shortcut: ["/icons/icon-192.png"],
  },
};

export const viewport: Viewport = {
  themeColor: "#000000",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
  viewportFit: "cover",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="en"
      data-scroll-behavior="smooth"
      className={`${appSans.variable} ${appNum.variable} h-full antialiased`}
    >
      <body className="min-h-full">
        <StoreProvider>{children}</StoreProvider>
      </body>
    </html>
  );
}
