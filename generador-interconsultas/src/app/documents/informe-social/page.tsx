'use client';

/**
 * Página: Generador de Informe Social Sanitario
 *
 * Layout de dos columnas:
 * - Izquierda: Formulario de trabajo social
 * - Derecha: Panel de texto generado
 */

import { useState, useEffect } from 'react';
import {
  InformeSocialForm,
  InformeSocialFormData,
  informeSocialDefaultTemplate,
  flattenInformeSocialData,
} from '@/features/documents/informe-social';
import { buildDocumentText } from '@/features/documents/base/templateEngine';
import GeneratedTextPanel from '@/components/GeneratedTextPanel';
import LegalDisclaimer from '@/components/LegalDisclaimer';

export default function InformeSocialPage() {
  const [generatedText, setGeneratedText] = useState('');
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Verificar si la IA está disponible
  useEffect(() => {
    async function checkAI() {
      try {
        const response = await fetch('/api/enhance-interconsulta');
        const data = await response.json();
        setAiAvailable(data.available === true);
      } catch {
        setAiAvailable(false);
      }
    }
    checkAI();
  }, []);

  // Generar el texto del informe
  const handleGenerate = (data: InformeSocialFormData) => {
    setLoading(true);
    setError(null);

    try {
      const variables = flattenInformeSocialData(data);
      const text = buildDocumentText(informeSocialDefaultTemplate, variables);
      setGeneratedText(text);
    } catch (err) {
      console.error('Error al generar informe:', err);
      setError('Error al generar el informe. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Mejorar el texto con IA
  const handleEnhance = async () => {
    if (!generatedText) return;

    setEnhancing(true);
    setError(null);

    try {
      const response = await fetch('/api/enhance-interconsulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: generatedText }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al mejorar el texto');
      }

      setGeneratedText(data.text);
    } catch (err) {
      console.error('Error al mejorar con IA:', err);
      setError(
        err instanceof Error
          ? err.message
          : 'Error al mejorar el texto con IA.'
      );
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <span className="text-3xl">👥</span>
          <h1 className="text-2xl font-bold text-gray-900">
            Informe Social Sanitario
          </h1>
        </div>
        <p className="text-gray-600">
          Genera informes de trabajo social con valoración sociofamiliar, recursos y plan de intervención.
        </p>
      </div>

      {/* Aviso legal */}
      <div className="mb-6">
        <LegalDisclaimer />
      </div>

      {/* Error global */}
      {error && (
        <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-2">
            <svg className="h-5 w-5 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-red-700">{error}</p>
          </div>
          <button
            onClick={() => setError(null)}
            className="mt-2 text-sm text-red-600 hover:text-red-800 underline"
          >
            Cerrar
          </button>
        </div>
      )}

      {/* Layout principal */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Columna izquierda: Formulario */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">
            Datos del Informe
          </h2>
          <InformeSocialForm onGenerate={handleGenerate} loading={loading} />
        </div>

        {/* Columna derecha: Texto generado */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 lg:sticky lg:top-8 lg:h-fit lg:max-h-[calc(100vh-6rem)]">
          <GeneratedTextPanel
            text={generatedText}
            onEnhance={handleEnhance}
            aiAvailable={aiAvailable}
            enhancing={enhancing}
          />
        </div>
      </div>

      {/* Pie de página */}
      <footer className="mt-12 text-center text-sm text-gray-500">
        <p>
          Generador de Documentos Médicos v2.0 &middot; Informe Social
        </p>
        <LegalDisclaimer variant="compact" />
      </footer>
    </div>
  );
}
