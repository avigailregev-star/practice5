import type { Metadata } from "next";
import { Rubik } from "next/font/google";
import "./globals.css";

const rubik = Rubik({
  subsets: ["hebrew", "latin"],
  variable: "--font-rubik",
  display: "swap",
  preload: false,
});

export const metadata: Metadata = {
  title: "Practice5 — חכם, מהיר, מוזיקלי",
  description: "אפליקציית תרגול מוזיקה חכמה",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${rubik.variable} font-sans bg-brand-bg text-brand-text`}>
        {children}
      </body>
    </html>
  );
}
