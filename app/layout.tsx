import type { Metadata } from "next"
import { Geist, Geist_Mono } from "next/font/google"
import "./globals.css"

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
})

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
})

export const metadata: Metadata = {
  title: {
    default: "SortiesApp — Événements et sorties près de chez toi",
    template: "%s | SortiesApp",
  },
  description: "Découvre les meilleurs concerts, randonnées, ateliers, marchés et événements locaux autour de toi. Gratuit, simple et sans pub.",
  keywords: ["événements locaux", "sorties", "concerts", "randonnées", "ateliers", "agenda", "activités", "france"],
  authors: [{ name: "SortiesApp" }],
  creator: "SortiesApp",
  publisher: "SortiesApp",
  metadataBase: new URL("https://sorties-app-seven.vercel.app"),
  openGraph: {
    type: "website",
    locale: "fr_FR",
    url: "https://sorties-app-seven.vercel.app",
    siteName: "SortiesApp",
    title: "SortiesApp — Événements et sorties près de chez toi",
    description: "Découvre les meilleurs concerts, randonnées, ateliers, marchés et événements locaux autour de toi.",
    images: [
      {
        url: "/og-image.jpg",
        width: 1200,
        height: 630,
        alt: "SortiesApp — Événements locaux",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "SortiesApp — Événements et sorties près de chez toi",
    description: "Découvre les meilleurs événements locaux autour de toi.",
    images: ["/og-image.jpg"],
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  icons: {
    icon: "/favicon.ico",
    apple: "/icons/icon-192x192.png",
  },
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SortiesApp",
  },
  formatDetection: {
    telephone: false,
  },
}

export const viewport = {
  themeColor: "#1a1a1a",
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="fr">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        {children}

      </body>
    </html>
  )
}