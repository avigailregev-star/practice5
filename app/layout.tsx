import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Practice5 — חכם, מהיר, מוזיקלי",
  description: "אפליקציית תרגול מוזיקה חכמה",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="he" dir="rtl">
      <body style={{ fontFamily: "'Miri', 'Rubik', sans-serif" }} className="bg-brand-bg text-brand-text">
        {children}
      </body>
    </html>
  );
}
