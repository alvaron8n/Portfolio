'use client';

/**
 * Página principal: Generador de Interconsultas
 *
 * Layout moderno SaaS con:
 * - Hero section con gradiente
 * - Formulario de interconsulta
 * - Panel de texto generado con vista profesional
 * - Integración con IA para mejora de redacción
 * - Soporte para webhooks/n8n
 */

import { useState, useEffect } from 'react';
import InterconsultaForm from '@/components/InterconsultaForm';
import GeneratedTextPanel, { AIMode } from '@/components/GeneratedTextPanel';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { InterconsultaFormData } from '@/types';
import { buildInterconsultaText } from '@/lib/templateEngine';
import { getPlantilla, getConfiguracion } from '@/lib/storage';

export default function HomePage() {
  const [generatedText, setGeneratedText] = useState('');
  const [formData, setFormData] = useState<InterconsultaFormData | undefined>();
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookWarning, setWebhookWarning] = useState<string | null>(null);

  // Verificar si la IA está disponible al cargar
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

  // Enviar a webhook si está configurado
  const sendToWebhook = async (data: InterconsultaFormData, text: string) => {
    try {
      const config = getConfiguracion();
      if (!config?.webhookEnabled || !config?.webhookUrl) return;

      const response = await fetch('/api/hooks/interconsulta-creada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: {
            type: 'interconsulta',
            text,
            formData: data,
            timestamp: new Date().toISOString(),
          },
        }),
      });

      const result = await response.json();

      if (!result.success) {
        setWebhookWarning('El documento se generó correctamente, pero no se pudo enviar al webhook externo.');
        // Auto-dismiss after 8 seconds
        setTimeout(() => setWebhookWarning(null), 8000);
      } else if (result.sent) {
        // Webhook sent successfully - clear any previous warning
        setWebhookWarning(null);
      }
    } catch (err) {
      console.warn('Error enviando webhook:', err);
      setWebhookWarning('El documento se generó correctamente, pero hubo un error de conexión con el webhook.');
      // Auto-dismiss after 8 seconds
      setTimeout(() => setWebhookWarning(null), 8000);
    }
  };

  // Generar el texto de la interconsulta
  const handleGenerate = async (data: InterconsultaFormData) => {
    setLoading(true);
    setError(null);

    try {
      // Obtener plantilla configurada (o usar la por defecto)
      const plantilla = getPlantilla('interconsulta');
      const text = buildInterconsultaText(data, plantilla || undefined);
      setGeneratedText(text);
      setFormData(data);

      // Enviar a webhook si está configurado
      await sendToWebhook(data, text);
    } catch (err) {
      console.error('Error al generar interconsulta:', err);
      setError('Error al generar el texto. Por favor, inténtelo de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  // Mejorar el texto con IA
  const handleEnhance = async (mode: AIMode) => {
    if (!generatedText) return;

    setEnhancing(true);
    setError(null);

    try {
      const response = await fetch('/api/enhance-interconsulta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ text: generatedText, mode }),
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
          : 'Error al mejorar el texto con IA. Por favor, inténtelo de nuevo.'
      );
    } finally {
      setEnhancing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center">
            <h1 className="text-3xl sm:text-4xl font-bold mb-3">
              Generador de Interconsultas
            </h1>
            <p className="text-blue-100 text-lg max-w-2xl mx-auto">
              Crea documentos médicos estructurados de forma rápida y profesional.
              Con mejora opcional por IA.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-6">
        {/* Aviso legal */}
        <div className="mb-6">
          <LegalDisclaimer />
        </div>

        {/* Error global */}
        {error && (
          <div className="mb-6 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-red-600 dark:text-red-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Webhook warning toast */}
        {webhookWarning && (
          <div className="mb-6 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg
                className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
              <p className="text-amber-700 dark:text-amber-300 text-sm">{webhookWarning}</p>
            </div>
            <button
              onClick={() => setWebhookWarning(null)}
              className="mt-2 text-sm text-amber-600 dark:text-amber-400 hover:text-amber-800 dark:hover:text-amber-300 underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Layout principal */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Columna izquierda: Formulario */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 transition-shadow hover:shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <svg className="h-6 w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                Datos de la Interconsulta
              </h2>
            </div>
            <InterconsultaForm onGenerate={handleGenerate} loading={loading} />
          </div>

          {/* Columna derecha: Texto generado */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-6 lg:sticky lg:top-8 lg:h-fit lg:max-h-[calc(100vh-6rem)] transition-shadow hover:shadow-xl">
            <GeneratedTextPanel
              text={generatedText}
              formData={formData}
              onEnhance={handleEnhance}
              aiAvailable={aiAvailable}
              enhancing={enhancing}
            />
          </div>
        </div>

        {/* Feature Cards */}
        <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-3 bg-green-100 dark:bg-green-900/50 rounded-lg w-fit mb-4">
              <svg className="h-6 w-6 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Formato Estandarizado</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Genera documentos con estructura profesional siguiendo estándares médicos.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-3 bg-purple-100 dark:bg-purple-900/50 rounded-lg w-fit mb-4">
              <svg className="h-6 w-6 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">Mejora con IA</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Mejora automática de redacción, formato y claridad sin alterar datos clínicos.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-3 bg-amber-100 dark:bg-amber-900/50 rounded-lg w-fit mb-4">
              <svg className="h-6 w-6 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-2">100% Privado</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Tus datos nunca salen del navegador. Solo se usa IA si tú lo solicitas.
            </p>
          </div>
        </div>

        {/* Pie de página */}
        <footer className="mt-12 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>
            Generador de Documentos Médicos v2.0 &middot; Interconsultas
          </p>
          <LegalDisclaimer variant="compact" />
        </footer>
      </div>
    </div>
  );
}
