import type { Metadata } from "next";
import { DM_Serif_Text, Inter, Noticia_Text } from "next/font/google";
import { SITE_URL } from "@/lib/env";
import "./globals.css";

// Rediseño 2026: DM Serif Text titula (también en el panel), Noticia Text lee.
// DM Serif viene en un solo peso (400): los titulares no usan font-bold/black
// — el tamaño y el contraste del trazo ponen la jerarquía.
const dmSerif = DM_Serif_Text({
  subsets: ["latin"],
  weight: "400",
  style: ["normal", "italic"],
  variable: "--font-dm-serif",
});

const noticia = Noticia_Text({
  subsets: ["latin"],
  weight: ["400", "700"],
  style: ["normal", "italic"],
  variable: "--font-noticia",
});

// Inter es la fuente de UI del panel de administración (ver .panel-admin).
const inter = Inter({
  subsets: ["latin"],
  weight: ["300", "400", "600", "700"],
  variable: "--font-inter",
});

export const metadata: Metadata = {
  // Base para resolver toda URL relativa de la metadata (og:image, canonical,
  // sitemap): sin esto, los links compartidos en redes salen sin imagen o
  // apuntando a rutas relativas que WhatsApp/Facebook no pueden resolver.
  metadataBase: new URL(SITE_URL),
  title: {
    default: "Fuente de Noticias — Tu fuente. Tu Tucumán.",
    // Las páginas hijas solo definen su parte; el template agrega la marca.
    template: "%s — Fuente de Noticias",
  },
  description:
    "Noticias locales y nacionales desde Tucumán. Rápido · Directo · Confiable.",
  openGraph: {
    siteName: "Fuente de Noticias",
    locale: "es_AR",
    type: "website",
  },
  alternates: {
    types: { "application/rss+xml": "/rss.xml" },
  },
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html
      lang="es"
      className={`${dmSerif.variable} ${noticia.variable} ${inter.variable}`}
    >
      <body className="min-h-screen">{children}</body>
    </html>
  );
}
