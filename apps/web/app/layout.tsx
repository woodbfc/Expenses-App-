import "./globals.css";
import type { ReactNode } from "react";

export const metadata = {
  title: "Ops Command Centre",
  description: "Rapid dump capture to live operations dashboard"
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <body className="min-h-screen bg-slate-950 text-slate-100">
        {children}
      </body>
    </html>
  );
}
