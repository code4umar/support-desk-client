import type { Metadata } from "next";
import { Outfit } from "next/font/google";
import { AuthProvider } from "@/lib/auth-context";
import { ToastProvider } from "@/components/Toast";
import Header from "@/components/Header";
import Shortcuts from "@/components/Shortcuts";
import CommandPalette from "@/components/CommandPalette";
import ShortcutsHelp from "@/components/ShortcutsHelp";
import NewTicketsBanner from "@/components/NewTicketsBanner";
import TitleSync from "@/components/TitleSync";
import "./globals.css";
import Script from "next/script";

const outfit = Outfit({
  subsets: ["latin"],
  variable: "--font-body",
  weight: ["400", "500", "600", "700"],
});

export const metadata: Metadata = {
  title: "Deskly",
  description: "Support Desk client",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={outfit.variable}>
      <body>
        <ToastProvider>
          <AuthProvider>
            <Header />
            <Shortcuts />
            <CommandPalette />
            <ShortcutsHelp />
            <NewTicketsBanner />
            <TitleSync />
            <main className="max-w-5xl mx-auto p-4">{children}</main>
          </AuthProvider>
        </ToastProvider>
        <Script src="/_vercel/insights/script.js" strategy="afterInteractive" />
      </body>
    </html>
  );
}