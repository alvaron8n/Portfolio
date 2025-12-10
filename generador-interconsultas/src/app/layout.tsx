import type { Metadata } from "next";
import "./globals.css";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "MediDocs | Generador de Documentos Médicos",
  description:
    "Herramienta profesional para generar documentos médicos de forma rápida y estructurada: interconsultas, informes de alta, peticiones de pruebas y más.",
  keywords: [
    "interconsulta",
    "medicina",
    "hospital",
    "documentación médica",
    "informe de alta",
    "petición de pruebas",
    "nota evolutiva",
    "informe social",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="es" suppressHydrationWarning>
      <head>
        {/* Script para evitar flash de modo incorrecto */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  var stored = localStorage.getItem('darkMode');
                  var prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
                  if (stored === 'true' || (stored === null && prefersDark)) {
                    document.documentElement.classList.add('dark');
                  }
                } catch (e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="antialiased bg-gray-50 dark:bg-gray-900 min-h-screen font-sans transition-colors">
        <Header />
        <main>{children}</main>
      </body>
    </html>
  );
}
