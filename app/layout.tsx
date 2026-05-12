import type { Metadata, Viewport } from "next";
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

export const viewport: Viewport = {
  themeColor: "#F4D23C",
  colorScheme: "dark",
};

export const metadata: Metadata = {
  applicationName: "Hybrid365",
  title: {
    default: "Hybrid365",
    template: "%s | Hybrid365",
  },
  description: "Hybrid strength and conditioning — programme, habits, challenge and progress.",
  appleWebApp: {
    capable: true,
    title: "Hybrid365",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: [{ url: "/icons/hybrid365-app.svg", type: "image/svg+xml" }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
