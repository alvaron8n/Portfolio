'use client';

/**
 * Panel para mostrar el texto generado de la interconsulta
 *
 * Funcionalidades:
 * - Muestra el texto generado con formato
 * - Botón para copiar al portapapeles
 * - Botón para mejorar con IA (si está disponible)
 * - Estados de carga y error
 */

import { useState } from 'react';

interface GeneratedTextPanelProps {
  text: string;
  onEnhance?: () => Promise<void>;
  aiAvailable?: boolean;
  enhancing?: boolean;
}

export default function GeneratedTextPanel({
  text,
  onEnhance,
  aiAvailable = false,
  enhancing = false,
}: GeneratedTextPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);

  // Imprimir documento
  const handlePrint = () => {
    window.print();
  };

  // Copiar texto al portapapeles
  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setCopyError(null);
      // Resetear el estado después de 2 segundos
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
      setCopyError('No se pudo copiar al portapapeles');
      setTimeout(() => setCopyError(null), 3000);
    }
  };

  // Si no hay texto, mostrar estado vacío
  if (!text) {
    return (
      <div className="h-full flex flex-col">
        <h2 className="text-lg font-semibold text-gray-900 mb-4">
          Texto Generado
        </h2>

        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1.5}
                d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
              />
            </svg>
            <p className="mt-4 text-gray-500">
              Rellene el formulario y pulse &quot;Generar Interconsulta&quot;
              para ver el documento aquí.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-lg font-semibold text-gray-900">
          Texto Generado
        </h2>

        <div className="flex gap-2 print:hidden">
          {/* Botón Copiar */}
          <button
            onClick={handleCopy}
            disabled={!text}
            className={`px-4 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
              copied
                ? 'bg-green-100 text-green-700'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Copiado
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
                  />
                </svg>
                Copiar
              </>
            )}
          </button>

          {/* Botón Imprimir */}
          <button
            onClick={handlePrint}
            disabled={!text}
            className="px-4 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 transition-colors flex items-center gap-2 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            Imprimir
          </button>

          {/* Botón Mejorar con IA */}
          {aiAvailable && onEnhance && (
            <button
              onClick={onEnhance}
              disabled={enhancing || !text}
              className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-100 text-purple-700 hover:bg-purple-200 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {enhancing ? (
                <>
                  <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Mejorando...
                </>
              ) : (
                <>
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M13 10V3L4 14h7v7l9-11h-7z"
                    />
                  </svg>
                  Mejorar con IA
                </>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Error de copia */}
      {copyError && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
          {copyError}
        </div>
      )}

      {/* Texto generado */}
      <div className="flex-1 overflow-hidden">
        <pre className="h-full overflow-auto p-4 bg-gray-50 border border-gray-200 rounded-lg text-sm text-gray-800 whitespace-pre-wrap font-mono">
          {text}
        </pre>
      </div>

      {/* Nota sobre IA */}
      {aiAvailable && (
        <p className="mt-3 text-xs text-gray-500 italic">
          La mejora con IA solo modifica la redacción. No añade ni modifica información clínica.
        </p>
      )}
    </div>
  );
}
