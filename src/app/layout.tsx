import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/layout/Header";
import { SessionProvider } from "@/components/providers/SessionProvider";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "Neetrino Academy - Онлайн обучение",
  description: "Профессиональное обучение WordPress, веб-разработке и Shopify",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body className={inter.className}>
        <SessionProvider>
          <div className="min-h-screen bg-blue-50">
            <Header />
            <main className="flex-1">
              {children}
            </main>
          </div>
        </SessionProvider>
      </body>
    </html>
  );
}
