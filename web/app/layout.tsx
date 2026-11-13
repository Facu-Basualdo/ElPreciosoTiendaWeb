import type { Metadata, Viewport } from "next";
import { Fraunces, Geist_Mono, Inter } from "next/font/google";
import { SITIO } from "@/lib/sitio";
import { Providers } from "./providers";
import "./globals.css";

// Fraunces para títulos (font-serif), Inter para el texto. Geist Mono sólo para SKUs.
const fraunces = Fraunces({
  variable: "--font-fraunces",
  subsets: ["latin"],
  style: ["normal", "italic"],
  axes: ["opsz"],
});

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  metadataBase: new URL(SITIO.url),
  title: { default: `${SITIO.nombre} · Escarapelas y prendedores artesanales`, template: `%s · ${SITIO.nombre}` },
  description: SITIO.descripcion,
  // La imagen por defecto la arma app/opengraph-image.tsx; las fichas usan la del producto.
  openGraph: { siteName: SITIO.nombre, locale: "es_AR", type: "website" },
};

export const viewport: Viewport = { themeColor: "#f7f5f0" };

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="es-AR" className={`${fraunces.variable} ${inter.variable} ${geistMono.variable} h-full antialiased`}>
      <body className="flex min-h-full flex-col bg-background font-sans text-foreground">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
