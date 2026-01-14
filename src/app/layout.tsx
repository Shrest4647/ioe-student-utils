import type { Metadata, Viewport } from "next";
import { Geist, Geist_Mono, Outfit } from "next/font/google";
import "@/styles/globals.css";
import { Navbar } from "@/components/common/navbar";
import { VibeKanbanCompanion } from "@/components/common/vibe-kanban-companion";
import { Toaster } from "@/components/ui/sonner";
import { Providers } from "./providers";

const outfit = Outfit({ subsets: ["latin"], variable: "--font-sans" });

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default:
      "IOE Student Utils - Bridging the Gap Between IOE and Global Standards",
    template: "%s | IOE Student Utils",
  },
  description:
    "The ultimate open-source toolkit for Institute of Engineering students to navigate their academic journey, explore colleges, departments, programs, courses, scholarships, and transition to international education.",
  keywords: [
    "IOE",
    "Institute of Engineering",
    "Nepal Engineering",
    "TU Engineering",
    "Tribhuvan University",
    "Pulchowk Campus",
    "Engineering Colleges",
    "Academic Resources",
    "Scholarships",
    "Course Information",
    "Program Ratings",
    "Engineering Education Nepal",
    "Student Tools",
    "GPA Converter",
    "Resume Builder",
  ],
  authors: [{ name: "IOE Student Utils" }],
  creator: "IOE Student Utils",
  publisher: "IOE Student Utils",
  metadataBase: new URL(
    process.env.NEXT_PUBLIC_APP_URL || "https://ioestudentutils.com",
  ),
  alternates: {
    canonical: "/",
  },
  openGraph: {
    type: "website",
    locale: "en_US",
    url: "/",
    title:
      "IOE Student Utils - Bridging the Gap Between IOE and Global Standards",
    description:
      "The ultimate open-source toolkit for Institute of Engineering students to navigate their academic journey and transition to international education.",
    siteName: "IOE Student Utils",
    images: [
      {
        url: "/og-image.png",
        width: 1200,
        height: 630,
        alt: "IOE Student Utils",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "IOESU - Bridging the Gap Between IOE and Global Standards",
    description:
      "The ultimate open-source toolkit for Institute of Engineering students to navigate their academic journey and transition to international education.",
    images: ["/og-image.png"],
    creator: "@ioesu",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-video-preview": -1,
      "max-image-preview": "large",
      "max-snippet": -1,
    },
  },
  verification: {
    // Add your verification codes here when available
    // google: "your-google-verification-code",
    // yandex: "your-yandex-verification-code",
  },
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "32x32", type: "image/x-icon" },
      { url: "/icon-16x16.png", sizes: "16x16", type: "image/png" },
      { url: "/icon-32x32.png", sizes: "32x32", type: "image/png" },
      {
        url: "/android-chrome-192x192.png",
        sizes: "192x192",
        type: "image/png",
      },
      {
        url: "/android-chrome-512x512.png",
        sizes: "512x512",
        type: "image/png",
      },
    ],
    apple: [
      { url: "/apple-touch-icon.png", sizes: "180x180", type: "image/png" },
    ],
  },
  manifest: "/manifest.json",
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  maximumScale: 5,
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html className={outfit.variable} lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <div className="min-h-screen">
            <Navbar />

            {children}
          </div>
          <Toaster />
          <VibeKanbanCompanion />
        </Providers>
      </body>
    </html>
  );
}
