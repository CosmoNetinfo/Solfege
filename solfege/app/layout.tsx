import type { Metadata } from "next";
import { Cormorant_Garamond, DM_Sans, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Toaster } from "sonner";

const cormorant = Cormorant_Garamond({
  variable: "--font-cormorant",
  subsets: ["latin"],
  weight: ["400", "600", "700"],
});

const dmSans = DM_Sans({
  variable: "--font-dm-sans",
  subsets: ["latin"],
  weight: ["300", "400", "500", "600"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Solfège — Gestione Scuole di Musica",
  description: "Il gestionale SaaS premium per la tua scuola di musica.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="it"
      className={`${cormorant.variable} ${dmSans.variable} ${jetbrains.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="min-h-full font-sans bg-background text-foreground">
        {children}
        <Toaster position="top-right" richColors />
      </body>
    </html>
  );
}

