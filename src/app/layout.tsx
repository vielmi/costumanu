import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";
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
  title: {
    template: `%s | ${APP_NAME}`,
    default: APP_NAME,
  },
  description:
    "Die digitale Plattform für Fundusnetzwerke aus Theater, Film und Musical. Kostüme suchen, leihen und verwalten.",
  openGraph: {
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
        <Script id="crisp-widget" strategy="afterInteractive">{`
          window.$crisp=[];
          window.CRISP_WEBSITE_ID="f0546c6b-a996-4340-8b2f-144a20310746";
          (function(){
            var d=document,s=d.createElement("script");
            s.src="https://client.crisp.chat/l.js";
            s.async=1;
            d.getElementsByTagName("head")[0].appendChild(s);
          })();
        `}</Script>
      </body>
    </html>
  );
}
