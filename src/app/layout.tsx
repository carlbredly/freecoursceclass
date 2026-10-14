import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Inscription - Formation Retouche Photo Gratuite",
  description: "Inscris-toi a la formation gratuite Lightroom & Photoshop",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="fr">
      <body>{children}</body>
    </html>
  );
}
