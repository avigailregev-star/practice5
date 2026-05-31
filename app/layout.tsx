import type { Metadata } from "next";
import { Heebo } from "next/font/google";
import "./globals.css";

const heebo = Heebo({ subsets: ["hebrew"], variable: "--font-heebo" });

export const metadata: Metadata = {
  title: "Practice5 — חכם, מהיר, מוזיקלי",
  description: "אפליקציית תרגול מוזיקה חכמה",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body className={`${heebo.variable} font-sans bg-gray-50 text-gray-900`}>
        {children}
      </body>
    </html>
  );
}
