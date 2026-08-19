import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import { CountryProvider } from "@/components/CountryProvider";
import { StoreProvider } from "@/lib/store";
import Sidebar from "@/components/Sidebar";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "My Expense Diary",
  description: "A personal expense tracking notebook",
  icons: {
    icon: [
      { url: "/favicon-32x32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16x16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  manifest: "/site.webmanifest",
  themeColor: "#D4854A",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full`}
      suppressHydrationWarning
    >
      <body className="min-h-full flex">
        <ThemeProvider>
          <CountryProvider>
            <AuthProvider>
              <ToastProvider>
                <StoreProvider>
                  <Sidebar />
                  <main className="flex-1 min-h-screen overflow-x-hidden">
                    {children}
                  </main>
                </StoreProvider>
              </ToastProvider>
            </AuthProvider>
          </CountryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
