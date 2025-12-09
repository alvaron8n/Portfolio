import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Generador de Interconsultas | Documentación Médica",
  description:
    "Herramienta profesional para generar borradores de interconsultas médicas de forma rápida y estructurada.",
  keywords: [
    "interconsulta",
    "medicina",
    "hospital",
    "derivación",
    "documentación médica",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es">
      <body className="antialiased bg-gray-50 min-h-screen font-sans">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
