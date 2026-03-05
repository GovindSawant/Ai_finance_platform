import { Inter } from "next/font/google";
import "./globals.css";
import { ClerkProvider } from "@clerk/nextjs";
import { Toaster } from "sonner";
import { Suspense } from "react";

const inter = Inter({
  subsets: ['latin'],
  display: 'swap',
  preload: true,
});

export const metadata = {
  title: "FinanceX AI - Smart Financial Management",
  description: "Take control of your finances with AI-powered insights, budgeting tools, and expense tracking.",
  keywords: ["finance", "budgeting", "AI", "personal finance", "expense tracking", "financial planning"],
  authors: [{ name: "FinanceX AI" }],
  robots: "index, follow",
  openGraph: {
    title: "FinanceX AI - Smart Financial Management",
    description: "Take control of your finances with AI-powered insights",
    type: "website",
  },
};

export const viewport = {
  width: 'device-width',
  initialScale: 1,
};

// Dynamically import Header to reduce initial bundle size
import dynamic from 'next/dynamic';
const Header = dynamic(() => import('@/components/ui/Header/Header'), {
  loading: () => <div className="h-16 bg-white/80 backdrop-blur-sm animate-pulse" />,
  ssr: true,
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <ClerkProvider>
      <html lang="en">
        <head>
          <link rel="preconnect" href="https://fonts.googleapis.com" />
          <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
          <link rel="dns-prefetch" href="//randomuser.me" />
        </head>
        <body className={`${inter.className} antialiased`}>
          <Suspense fallback={null}>
            <Header />
          </Suspense>

          <main className="min-h-screen">
            {children}
          </main>

          <Toaster richColors />

          <footer className="bg-gray-800 text-white py-6">
            <div className="container mx-auto px-4 flex flex-col md:flex-row justify-between items-center">
              <p className="text-sm">&copy; 2025 AI Finance Platform. All rights reserved.</p>
              <div className="mt-4 md:mt-0 flex space-x-4">
                <a href="#" className="text-gray-400 hover:text-white transition">Privacy Policy</a>
                <a href="#" className="text-gray-400 hover:text-white transition">Terms of Service</a>
                <a href="#" className="text-gray-400 hover:text-white transition">Contact</a>
              </div>
            </div>
          </footer>
        </body>
      </html>
    </ClerkProvider>
  );
}
