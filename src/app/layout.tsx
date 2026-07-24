import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import { auth, signOut } from "@/lib/auth";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Bid Tracker",
  description: "Track bids across departments, connected to Microsoft 365.",
  appleWebApp: {
    title: "Bid Tracker",
    statusBarStyle: "default",
  },
};

export const viewport: Viewport = {
  themeColor: "#18181b",
};

export default async function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  const session = await auth();

  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-zinc-50 text-zinc-900">
        <header className="border-b border-zinc-200 bg-white">
          <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-3">
            <Link href="/" className="text-lg font-semibold tracking-tight">
              Bid Tracker
            </Link>
            {session?.user && (
              <nav className="flex items-center gap-4 text-sm font-medium text-zinc-600">
                <Link href="/" className="hover:text-zinc-900">
                  Dashboard
                </Link>
                <Link href="/settings" className="hover:text-zinc-900">
                  Settings
                </Link>
                <Link
                  href="/bids/new"
                  className="rounded-md bg-zinc-900 px-3 py-1.5 text-white hover:bg-zinc-700"
                >
                  New Bid
                </Link>
                <span className="text-zinc-400">|</span>
                <span className="text-zinc-500">{session.user.name}</span>
                <form
                  action={async () => {
                    "use server";
                    await signOut({ redirectTo: "/signin" });
                  }}
                >
                  <button type="submit" className="hover:text-zinc-900">
                    Sign out
                  </button>
                </form>
              </nav>
            )}
          </div>
        </header>
        <main className="mx-auto w-full max-w-7xl flex-1 px-6 py-8">{children}</main>
      </body>
    </html>
  );
}
