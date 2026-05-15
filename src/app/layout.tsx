import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import { Providers } from "@/components/providers";
import { APP_NAME } from "@/lib/constants/app";
import "./globals.css";

const inter = Inter({
  variable: "--font-family-base",
  subsets: ["latin"],
  weight: ["300", "400", "500", "700", "900"],
  display: "swap",
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: `${APP_NAME} | Die digitale Plattform für Fundusnetzwerke aus Theater, Film und Musical`,
  description: "Die digitale Plattform für Fundusnetzwerke aus Theater, Film und Musical. Kostüme suchen, leihen und verwalten.",
  openGraph: {
    title: `${APP_NAME} | Die digitale Plattform für Fundusnetzwerke aus Theater, Film und Musical`,
    description:
      "Die digitale Plattform für Fundusnetzwerke aus Theater, Film und Musical. Kostüme suchen, leihen und verwalten.",
    images: [{ url: "/og-image.jpg", width: 1200, height: 630 }],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="de" className={`${inter.variable} ${geistMono.variable}`}>
      <body className="antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
