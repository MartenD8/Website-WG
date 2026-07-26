import type { Metadata, Viewport } from "next";
import { Roboto } from "next/font/google";
import { AppThemeProvider } from "@/theme/ThemeRegistry";

const roboto = Roboto({
  weight: ["400", "500", "700"],
  subsets: ["latin", "latin-ext"],
  display: "swap",
  variable: "--font-roboto",
});

const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: "Event Kalender",
    template: "%s | Event Kalender",
  },
  description:
    "Entdecke den Event-Kalender vom 25. September bis 18. Oktober – mit YouTube-Videos und Explorationsstufen.",
  openGraph: {
    title: "Event Kalender",
    description:
      "Moderne Präsentationsplattform für Events mit YouTube-Weiterleitung.",
    type: "website",
    locale: "de_DE",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#F8F9FC" },
    { media: "(prefers-color-scheme: dark)", color: "#111318" },
  ],
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={roboto.variable}>
      <body className={roboto.className}>
        <AppThemeProvider>{children}</AppThemeProvider>
      </body>
    </html>
  );
}
