import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";
import { AuthProvider } from "@/components/AuthProvider";
import { ToastProvider } from "@/components/Toast";
import { CountryProvider } from "@/components/CountryProvider";
import { StoreProvider } from "@/lib/store";
import ThemeToggle from "@/components/ThemeToggle";
import Sidebar from "@/components/Sidebar";
import BillReminderManager from "@/components/BillReminderManager";

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
};

export const viewport: Viewport = {
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
                  <a href="#main-content" className="sr-only focus:not-sr-only focus:fixed focus:top-2 focus:left-2 focus:z-[100] focus:bg-accent-warm focus:text-white focus:px-4 focus:py-2 focus:rounded-lg focus:font-semibold">
                    Skip to content
                  </a>
                  <Sidebar />
                  <main id="main-content" className="flex-1 min-h-screen overflow-x-hidden">
                    {children}
                  </main>
                  <ThemeToggle />
                  <BillReminderManager />
                </StoreProvider>
              </ToastProvider>
            </AuthProvider>
          </CountryProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
