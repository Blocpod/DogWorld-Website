import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL
  ?? (process.env.VERCEL_PROJECT_PRODUCTION_URL
    ? `https://${process.env.VERCEL_PROJECT_PRODUCTION_URL}`
    : "http://localhost:3000");

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: "DOG•WORLD — A new world for DOG",
  description: "Create your DOG, find your Pack, and build a community-powered world with DOG on Bitcoin.",
  applicationName: "DOG•WORLD",
  icons: { icon: "/dog-world-emblem.png", shortcut: "/dog-world-emblem.png" },
  openGraph: {
    title: "DOG•WORLD — A new world for DOG",
    description: "Create. Connect. Tip. Play. Build with DOG on Bitcoin.",
    type: "website",
    images: [{ url: "/dog-world-hero-world.png", width: 1915, height: 821, alt: "DOG•WORLD — a living community world on Bitcoin" }],
  },
  twitter: {
    card: "summary_large_image",
    title: "DOG•WORLD — A new world for DOG",
    description: "Create. Connect. Tip. Play. Build with DOG on Bitcoin.",
    images: ["/dog-world-hero-world.png"],
  },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#f4eedf" },
    { media: "(prefers-color-scheme: dark)", color: "#171715" },
  ],
};

const themeBoot = `(()=>{try{const t=localStorage.getItem('dogworld-theme');const m=t||((matchMedia('(prefers-color-scheme:dark)').matches)?'dark':'light');document.documentElement.dataset.theme=m;}catch(e){document.documentElement.dataset.theme='dark'}})()`;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head><script dangerouslySetInnerHTML={{ __html: themeBoot }} /></head>
      <body>{children}</body>
    </html>
  );
}
