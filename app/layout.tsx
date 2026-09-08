import type { Metadata } from "next";
import { AuthProvider } from "@/lib/auth-context";
import Header from "@/components/Header";
import "./globals.css";

export const metadata: Metadata = {
  title: "Support Desk",
  description: "Support Desk client",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <Header />
          <main className="max-w-5xl mx-auto p-4">{children}</main>
        </AuthProvider>
      </body>
    </html>
  );
}