import { Bebas_Neue, Oswald } from "next/font/google";
import type { ReactNode } from "react";

const display = Bebas_Neue({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-boxcross-display",
});

const body = Oswald({
  weight: ["400", "500", "600", "700"],
  subsets: ["latin"],
  variable: "--font-boxcross-body",
});

export default function BoxCrossSkiChallengeLayout({ children }: { children: ReactNode }) {
  return (
    <div
      className={`${display.variable} ${body.variable} min-h-screen bg-[#0A0A0A] text-white antialiased`}
      style={{ fontFamily: "var(--font-boxcross-body), system-ui, sans-serif" }}
    >
      {children}
    </div>
  );
}
