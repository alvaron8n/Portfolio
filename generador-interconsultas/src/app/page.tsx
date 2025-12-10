'use client';

/**
 * Generador de Interconsultas Clinicas
 *
 * UI profesional estilo software medico con:
 * - Cabecera compacta
 * - Barra de metricas discreta
 * - Layout de dos columnas
 * - Soporte responsive y dark mode
 */

import { useState, useEffect, useCallback } from 'react';
import InterconsultaForm from '@/components/InterconsultaForm';
import GeneratedTextPanel, { AIMode } from '@/components/GeneratedTextPanel';
import LegalDisclaimer from '@/components/LegalDisclaimer';
import { InterconsultaFormData } from '@/types';
import { buildInterconsultaText } from '@/lib/templateEngine';
import { getPlantilla, getConfiguracion } from '@/lib/storage';
import { getQuickModeConfig, toggleQuickMode } from '@/lib/quickMode';
import { getBranding, hasBranding, isColorDark } from '@/lib/branding';
import { trackDocumentGenerated, getEstadisticasGenerales, getTiempoAhorradoEstimado } from '@/lib/analytics';
import { addToHistorial, generateTitulo } from '@/lib/historial';
import { createCase, setCurrentCase, DOCUMENT_TYPES, getDocumentIconClass } from '@/lib/caseManager';
import Link from 'next/link';

export default function HomePage() {
  const [generatedText, setGeneratedText] = useState('');
  const [originalText, setOriginalText] = useState('');
  const [formData, setFormData] = useState<InterconsultaFormData | undefined>();
  const [loading, setLoading] = useState(false);
  const [enhancing, setEnhancing] = useState(false);
  const [aiAvailable, setAiAvailable] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [webhookWarning, setWebhookWarning] = useState<string | null>(null);

  // Quick Mode
  const [quickMode, setQuickMode] = useState(false);
  const [autoDraft, setAutoDraft] = useState('');

  // Multi-Doc
  const [showMultiDocMenu, setShowMultiDocMenu] = useState(false);

  // Client-side data (loaded after mount)
  const [branding, setBranding] = useState<ReturnType<typeof getBranding> | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof getEstadisticasGenerales> | null>(null);
  const [tiempoAhorrado, setTiempoAhorrado] = useState<ReturnType<typeof getTiempoAhorradoEstimado> | null>(null);
  const [mounted, setMounted] = useState(false);

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load client-side data after mount
  useEffect(() => {
    const config = getQuickModeConfig();
    setQuickMode(config.enabled);
    setBranding(getBranding());
    setStats(getEstadisticasGenerales());
    setTiempoAhorrado(getTiempoAhorradoEstimado());
    setMounted(true);
  }, []);

  // Check AI availability
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

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        handleToggleQuickMode();
      }
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData, generatedText]);

  const handleToggleQuickMode = useCallback(() => {
    const newState = toggleQuickMode();
    setQuickMode(newState);
  }, []);

  const handleSaveDraft = useCallback(() => {
    if (!formData) return;
    const titulo = generateTitulo('interconsulta', formData.paciente.nombre, formData.servicioDestino);
    addToHistorial('interconsulta', titulo, formData as unknown as Record<string, unknown>, generatedText);
    showSuccess('Borrador guardado');
  }, [formData, generatedText]);

  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  const handleAutoDraft = useCallback((data: InterconsultaFormData) => {
    const plantilla = getPlantilla('interconsulta');
    const text = buildInterconsultaText(data, plantilla || undefined);
    setAutoDraft(text);
  }, []);

  const sendToWebhook = async (data: InterconsultaFormData, text: string) => {
    try {
      const config = getConfiguracion();
      if (!config?.webhookEnabled || !config?.webhookUrl) return;

      const response = await fetch('/api/hooks/interconsulta-creada', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          document: { type: 'interconsulta', text, formData: data, timestamp: new Date().toISOString() },
        }),
      });

      const result = await response.json();
      if (!result.success) {
        setWebhookWarning('Documento generado. Error al enviar al webhook.');
        setTimeout(() => setWebhookWarning(null), 5000);
      }
    } catch {
      setWebhookWarning('Documento generado. Error de conexion con webhook.');
      setTimeout(() => setWebhookWarning(null), 5000);
    }
  };

  const handleGenerate = async (data: InterconsultaFormData) => {
    setLoading(true);
    setError(null);

    try {
      const plantilla = getPlantilla('interconsulta');
      const text = buildInterconsultaText(data, plantilla || undefined);
      setGeneratedText(text);
      setOriginalText(text);
      setFormData(data);
      setAutoDraft('');

      trackDocumentGenerated('interconsulta', data.servicioDestino, text.length, false);
      const titulo = generateTitulo('interconsulta', data.paciente.nombre, data.servicioDestino);
      addToHistorial('interconsulta', titulo, data as unknown as Record<string, unknown>, text);
      await sendToWebhook(data, text);

      setStats(getEstadisticasGenerales());
      setTiempoAhorrado(getTiempoAhorradoEstimado());

      showSuccess('Documento generado');
    } catch (err) {
      console.error('Error al generar:', err);
      setError('Error al generar el documento.');
    } finally {
      setLoading(false);
    }
  };

  const handleEnhance = async (mode: AIMode) => {
    if (!generatedText) return;
    setEnhancing(true);
    setError(null);

    try {
      const response = await fetch('/api/enhance-interconsulta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: generatedText, mode }),
      });

      const data = await response.json();
      if (!response.ok) throw new Error(data.error || 'Error al mejorar');

      setGeneratedText(data.text);
      if (formData) {
        trackDocumentGenerated('interconsulta', formData.servicioDestino, data.text.length, true);
      }
    } catch (err) {
      console.error('Error IA:', err);
      setError(err instanceof Error ? err.message : 'Error al mejorar con IA.');
    } finally {
      setEnhancing(false);
    }
  };

  const handleCreateCase = () => {
    if (!formData) return;
    const caseData = createCase({
      nombre: `Caso - ${formData.paciente.nombre || 'Sin nombre'}`,
      paciente: formData.paciente,
      antecedentes: formData.informacionClinica.antecedentesRelevantes,
      exploracion: formData.informacionClinica.exploracionDatosRelevantes,
      tratamientoActual: formData.informacionClinica.tratamientoActual,
      medico: formData.medico,
    });
    setCurrentCase(caseData);
    setShowMultiDocMenu(true);
  };

  // Branding colors
  const brandColor = branding?.colorPrincipal || '#1e3a5f';
  const textOnBrand = isColorDark(brandColor) ? 'text-white' : 'text-gray-900';

  return (
    <div className="min-h-screen bg-gray-100 dark:bg-gray-900">
      {/* ===== CABECERA ===== */}
      <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex items-center justify-between h-14">
            {/* Logo + Titulo */}
            <div className="flex items-center gap-3">
              <div
                className="h-8 w-8 rounded flex items-center justify-center text-xs font-bold"
                style={{ backgroundColor: brandColor, color: isColorDark(brandColor) ? 'white' : '#1f2937' }}
              >
                {mounted && branding?.logoUrl ? (
                  <img src={branding.logoUrl} alt="" className="h-6 w-6 object-contain" />
                ) : (
                  <span>IC</span>
                )}
              </div>
              <div className="hidden sm:block">
                <h1 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Generador de Interconsultas
                </h1>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  Documentacion clinica estandarizada
                </p>
              </div>
            </div>

            {/* Nav Actions */}
            <div className="flex items-center gap-1 sm:gap-2">
              {/* Quick Mode Toggle */}
              <button
                onClick={handleToggleQuickMode}
                className={`px-2 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1 ${
                  quickMode
                    ? 'bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
                title="Modo rapido (Ctrl+M)"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden sm:inline">Rapido</span>
              </button>

              {/* Links */}
              <Link
                href="/historial"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Historial"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>

              <Link
                href="/analitica"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Estadisticas"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Link>

              <Link
                href="/configuracion"
                className="p-2 text-gray-500 hover:text-gray-700 hover:bg-gray-100 dark:text-gray-400 dark:hover:text-gray-200 dark:hover:bg-gray-700 rounded transition-colors"
                title="Configuracion"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* ===== BARRA DE METRICAS ===== */}
      <div className="bg-gray-50 dark:bg-gray-800/50 border-b border-gray-200 dark:border-gray-700 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
          <div className="flex flex-wrap items-center justify-between gap-2 text-xs">
            {/* Metricas */}
            <div className="flex flex-wrap items-center gap-3 sm:gap-4">
              <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="text-gray-600 dark:text-gray-300">
                  {tiempoAhorrado?.descripcion || '~7 min'} por informe
                </span>
              </div>

              <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                <svg className="h-3.5 w-3.5 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="text-gray-600 dark:text-gray-300">
                  {stats?.totalDocumentos || 0} documentos generados
                </span>
              </div>

              {aiAvailable && (
                <div className="flex items-center gap-1.5 px-2 py-1 bg-white dark:bg-gray-700 rounded border border-gray-200 dark:border-gray-600">
                  <svg className="h-3.5 w-3.5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                  </svg>
                  <span className="text-gray-600 dark:text-gray-300">IA disponible</span>
                </div>
              )}
            </div>

            {/* Atajos */}
            <div className="hidden md:flex items-center gap-2 text-gray-400 dark:text-gray-500">
              <kbd className="px-1.5 py-0.5 bg-gray-200 dark:bg-gray-600 rounded text-[10px]">Ctrl+Enter</kbd>
              <span>generar</span>
            </div>
          </div>
        </div>
      </div>

      {/* ===== QUICK MODE BANNER ===== */}
      {quickMode && (
        <div className="bg-amber-50 dark:bg-amber-900/20 border-b border-amber-200 dark:border-amber-800 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-2">
            <div className="flex items-center justify-between text-xs">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">Modo Consulta Rapida</span>
                <span className="text-amber-600 dark:text-amber-400">Solo campos esenciales</span>
              </div>
              <button
                onClick={handleToggleQuickMode}
                className="text-amber-700 dark:text-amber-300 hover:underline"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ===== CONTENIDO PRINCIPAL ===== */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        {/* Alertas */}
        {successMessage && (
          <div className="mb-3 p-2 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded">
            <div className="flex items-start justify-between gap-2">
              <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
              <button onClick={() => setError(null)} className="text-red-500 hover:text-red-700">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
          </div>
        )}

        {webhookWarning && (
          <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded text-amber-700 dark:text-amber-300 text-sm">
            {webhookWarning}
          </div>
        )}

        {/* Auto Draft Preview */}
        {quickMode && autoDraft && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-medium text-blue-800 dark:text-blue-200">Borrador en tiempo real</span>
              <span className="text-[10px] text-blue-500">Pulsa Generar para finalizar</span>
            </div>
            <pre className="text-xs text-blue-700 dark:text-blue-300 whitespace-pre-wrap max-h-20 overflow-y-auto">
              {autoDraft.substring(0, 300)}{autoDraft.length > 300 ? '...' : ''}
            </pre>
          </div>
        )}

        {/* Legal */}
        <div className="mb-4">
          <LegalDisclaimer />
        </div>

        {/* Layout de dos columnas */}
        <div className={`grid gap-4 lg:gap-6 ${quickMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Columna: Formulario */}
          <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <div className="flex items-center gap-2 mb-4 pb-3 border-b border-gray-100 dark:border-gray-700">
              <div className="h-8 w-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                <svg className="h-4 w-4 text-gray-500 dark:text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                  Datos de la Interconsulta
                </h2>
                <p className="text-[11px] text-gray-500 dark:text-gray-400">
                  {quickMode ? 'Campos esenciales' : 'Complete los campos requeridos'}
                </p>
              </div>
            </div>
            <InterconsultaForm
              onGenerate={handleGenerate}
              loading={loading}
              quickMode={quickMode}
              onAutoGenerate={handleAutoDraft}
            />
          </div>

          {/* Columna: Resultado */}
          {(!quickMode || generatedText) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:sticky lg:top-4">
              <GeneratedTextPanel
                text={generatedText}
                originalText={originalText}
                formData={formData}
                onEnhance={handleEnhance}
                aiAvailable={aiAvailable}
                enhancing={enhancing}
                servicioDestino={formData?.servicioDestino}
              />

              {/* Multi-Document */}
              {generatedText && formData && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <button
                      onClick={() => setShowMultiDocMenu(!showMultiDocMenu)}
                      className="w-full px-3 py-2 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                      Crear otro documento
                      <svg className={`h-3.5 w-3.5 transition-transform ${showMultiDocMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showMultiDocMenu && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10">
                        <p className="text-[10px] text-gray-500 dark:text-gray-400 px-2 mb-1">
                          Usar los mismos datos del paciente:
                        </p>
                        <div className="space-y-0.5">
                          {DOCUMENT_TYPES.filter(d => d.id !== 'interconsulta').map(doc => (
                            <Link
                              key={doc.id}
                              href={doc.ruta}
                              onClick={handleCreateCase}
                              className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <svg className={`h-3.5 w-3.5 ${getDocumentIconClass(doc.icon)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <span className="text-xs text-gray-700 dark:text-gray-300">{doc.nombre}</span>
                            </Link>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </main>

      {/* ===== FOOTER ===== */}
      <footer className="mt-8 py-4 border-t border-gray-200 dark:border-gray-700 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-400 dark:text-gray-500">
            <div className="flex items-center gap-3">
              <span>Generador de Interconsultas v3.0</span>
              <span className="hidden sm:inline">|</span>
              <Link href="/historial" className="hover:text-gray-600 dark:hover:text-gray-300">Historial</Link>
              <Link href="/configuracion" className="hover:text-gray-600 dark:hover:text-gray-300">Configuracion</Link>
            </div>
            <LegalDisclaimer variant="compact" />
          </div>
        </div>
      </footer>
    </div>
  );
}
