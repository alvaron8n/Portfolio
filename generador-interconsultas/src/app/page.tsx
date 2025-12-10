'use client';

/**
 * Página principal: Generador de Interconsultas
 *
 * UI profesional estilo software clínico con:
 * - Barra de cabecera compacta con branding
 * - Barra de métricas de sesión
 * - Modo Consulta Rápida
 * - Formulario estructurado
 * - Panel de documento generado
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

  // Multi-Doc Wizard
  const [showMultiDocMenu, setShowMultiDocMenu] = useState(false);

  // Branding & Stats (client-side only)
  const [branding, setBranding] = useState<ReturnType<typeof getBranding> | null>(null);
  const [stats, setStats] = useState<ReturnType<typeof getEstadisticasGenerales> | null>(null);
  const [tiempoAhorrado, setTiempoAhorrado] = useState<ReturnType<typeof getTiempoAhorradoEstimado> | null>(null);

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Load client-side data after mount (avoid hydration mismatch)
  useEffect(() => {
    const config = getQuickModeConfig();
    setQuickMode(config.enabled);
    setBranding(getBranding());
    setStats(getEstadisticasGenerales());
    setTiempoAhorrado(getTiempoAhorradoEstimado());
  }, []);

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
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleClearForm();
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
    showSuccess('Borrador guardado en historial');
  }, [formData, generatedText]);

  const handleClearForm = useCallback(() => {
    if (formData && (formData.paciente.nombre || formData.informacionClinica.motivoPrincipal)) {
      if (confirm('Limpiar todos los campos del formulario?')) {
        window.location.reload();
      }
    }
  }, [formData]);

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
        setWebhookWarning('Documento generado, pero no se pudo enviar al webhook externo.');
        setTimeout(() => setWebhookWarning(null), 8000);
      }
    } catch {
      setWebhookWarning('Documento generado, pero error de conexion con el webhook.');
      setTimeout(() => setWebhookWarning(null), 8000);
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

      // Update stats
      setStats(getEstadisticasGenerales());
      setTiempoAhorrado(getTiempoAhorradoEstimado());

      showSuccess('Documento generado correctamente');
    } catch (err) {
      console.error('Error al generar interconsulta:', err);
      setError('Error al generar el texto. Por favor, intentelo de nuevo.');
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
      if (!response.ok) throw new Error(data.error || 'Error al mejorar el texto');

      setGeneratedText(data.text);
      if (formData) {
        trackDocumentGenerated('interconsulta', formData.servicioDestino, data.text.length, true);
      }
    } catch (err) {
      console.error('Error al mejorar con IA:', err);
      setError(err instanceof Error ? err.message : 'Error al mejorar el texto con IA.');
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

  // Get branding colors (with defaults for SSR)
  const brandColor = branding?.colorPrincipal || '#1e40af';
  const textOnBrand = isColorDark(brandColor) ? 'text-white' : 'text-gray-900';

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Compact Header Bar */}
      <header
        className="border-b border-gray-200 dark:border-gray-700 print:hidden"
        style={{ backgroundColor: brandColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            {/* Left: Branding */}
            <div className="flex items-center gap-3">
              {branding && hasBranding() && branding.mostrarEnHeader && branding.logoUrl ? (
                <img src={branding.logoUrl} alt="" className="h-8 w-8 rounded" />
              ) : (
                <div className={`h-8 w-8 rounded flex items-center justify-center bg-white/20 ${textOnBrand}`}>
                  <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
              )}
              <div>
                <h1 className={`text-sm font-semibold ${textOnBrand}`}>
                  {branding?.nombreCentro || 'Generador de Documentos'}
                </h1>
                {branding?.subtitulo && (
                  <p className={`text-xs ${textOnBrand} opacity-75`}>{branding.subtitulo}</p>
                )}
              </div>
            </div>

            {/* Center: Document Type */}
            <div className={`hidden sm:block text-center ${textOnBrand}`}>
              <span className="text-sm font-medium">Interconsulta</span>
            </div>

            {/* Right: Actions */}
            <div className="flex items-center gap-2">
              <button
                onClick={handleToggleQuickMode}
                className={`px-2.5 py-1.5 rounded text-xs font-medium transition-colors flex items-center gap-1.5 ${
                  quickMode
                    ? 'bg-white/25 ring-1 ring-white/50'
                    : 'bg-white/10 hover:bg-white/20'
                } ${textOnBrand}`}
                title="Ctrl+M"
              >
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden md:inline">Rapido</span>
                {quickMode && <span className="text-[10px] bg-white/30 px-1 rounded">ON</span>}
              </button>

              <Link
                href="/historial"
                className={`p-2 rounded bg-white/10 hover:bg-white/20 transition-colors ${textOnBrand}`}
                title="Historial"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </Link>

              <Link
                href="/analitica"
                className={`p-2 rounded bg-white/10 hover:bg-white/20 transition-colors ${textOnBrand}`}
                title="Analitica"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </Link>

              <Link
                href="/configuracion"
                className={`p-2 rounded bg-white/10 hover:bg-white/20 transition-colors ${textOnBrand}`}
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

      {/* Metrics Bar */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
          <div className="flex items-center justify-between gap-4 text-xs">
            <div className="flex items-center gap-4 sm:gap-6">
              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span className="font-medium text-gray-900 dark:text-gray-100">{stats?.totalDocumentos ?? 0}</span>
                <span className="hidden sm:inline">documentos</span>
              </div>

              <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span className="font-medium text-gray-900 dark:text-gray-100">{tiempoAhorrado?.descripcion ?? '0 min'}</span>
                <span className="hidden sm:inline">ahorrados</span>
              </div>

              {aiAvailable && (
                <div className="flex items-center gap-1.5 text-gray-600 dark:text-gray-400">
                  <svg className="h-3.5 w-3.5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  <span className="hidden sm:inline">IA disponible</span>
                  <span className="sm:hidden">IA</span>
                </div>
              )}
            </div>

            {/* Keyboard hints */}
            <div className="hidden md:flex items-center gap-3 text-gray-400 dark:text-gray-500">
              <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Ctrl+Enter</kbd> generar</span>
              <span><kbd className="px-1 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Ctrl+M</kbd> rapido</span>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Mode Indicator */}
      {quickMode && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800 print:hidden">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-1.5">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200 text-xs">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="font-medium">Modo Consulta Rapida</span>
                <span className="text-amber-600 dark:text-amber-400">- solo campos esenciales</span>
              </div>
              <button onClick={handleToggleQuickMode} className="text-xs text-amber-700 dark:text-amber-300 hover:underline">
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 sm:py-6">
        {/* Legal Disclaimer */}
        <div className="mb-3">
          <LegalDisclaimer />
        </div>

        {/* Alerts */}
        {successMessage && (
          <div className="mb-3 p-2.5 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
            <svg className="h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}

        {error && (
          <div className="mb-3 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 text-red-600 dark:text-red-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <div className="flex-1">
                <p className="text-red-700 dark:text-red-300 text-sm">{error}</p>
                <button onClick={() => setError(null)} className="mt-1 text-xs text-red-600 dark:text-red-400 hover:underline">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {webhookWarning && (
          <div className="mb-3 p-3 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-start gap-2">
              <svg className="h-4 w-4 text-amber-600 dark:text-amber-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <div className="flex-1">
                <p className="text-amber-700 dark:text-amber-300 text-sm">{webhookWarning}</p>
                <button onClick={() => setWebhookWarning(null)} className="mt-1 text-xs text-amber-600 dark:text-amber-400 hover:underline">
                  Cerrar
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Auto Draft in Quick Mode */}
        {quickMode && autoDraft && (
          <div className="mb-3 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300 text-xs">
                <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="font-medium">Borrador autogenerado</span>
              </div>
              <span className="text-xs text-blue-500 dark:text-blue-400">Pulsa Generar para version final</span>
            </div>
            <pre className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap max-h-24 overflow-y-auto bg-white/50 dark:bg-gray-800/50 rounded p-2">
              {autoDraft.substring(0, 400)}{autoDraft.length > 400 ? '...' : ''}
            </pre>
          </div>
        )}

        {/* Two Column Layout */}
        <div className={`grid gap-4 ${quickMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Form Column */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5">
            <div className="flex items-center justify-between gap-3 mb-4">
              <div className="flex items-center gap-2.5">
                <div className="p-1.5 bg-blue-100 dark:bg-blue-900/50 rounded">
                  <svg className="h-4 w-4 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                    Datos de la Interconsulta
                  </h2>
                  {quickMode && (
                    <p className="text-[11px] text-gray-500 dark:text-gray-400">Campos esenciales</p>
                  )}
                </div>
              </div>
            </div>
            <InterconsultaForm
              onGenerate={handleGenerate}
              loading={loading}
              quickMode={quickMode}
              onAutoGenerate={handleAutoDraft}
            />
          </div>

          {/* Generated Text Column */}
          {(!quickMode || generatedText) && (
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sm:p-5 lg:sticky lg:top-4 lg:h-fit lg:max-h-[calc(100vh-6rem)]">
              <GeneratedTextPanel
                text={generatedText}
                originalText={originalText}
                formData={formData}
                onEnhance={handleEnhance}
                aiAvailable={aiAvailable}
                enhancing={enhancing}
                servicioDestino={formData?.servicioDestino}
              />

              {/* Multi-Document Actions */}
              {generatedText && formData && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <button
                      onClick={() => setShowMultiDocMenu(!showMultiDocMenu)}
                      className="w-full px-3 py-2 text-xs font-medium rounded-lg bg-slate-100 dark:bg-slate-700 text-slate-700 dark:text-slate-300 hover:bg-slate-200 dark:hover:bg-slate-600 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4.586a1 1 0 01.707.293l4.414 4.414a1 1 0 01.293.707V15a2 2 0 01-2 2h-2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2v-2" />
                      </svg>
                      Crear otro documento con estos datos
                      <svg className={`h-3.5 w-3.5 transition-transform ${showMultiDocMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showMultiDocMenu && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10">
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 px-2 mb-2">
                          Generar otro documento con los mismos datos del paciente:
                        </p>
                        <div className="space-y-1">
                          {DOCUMENT_TYPES.filter(d => d.id !== 'interconsulta').map(doc => (
                            <Link
                              key={doc.id}
                              href={doc.ruta}
                              onClick={handleCreateCase}
                              className="flex items-center gap-3 px-3 py-2 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <svg className={`h-4 w-4 ${getDocumentIconClass(doc.icon)}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                              <div>
                                <p className="text-xs font-medium text-gray-900 dark:text-gray-100">{doc.nombre}</p>
                                <p className="text-[11px] text-gray-500 dark:text-gray-400">{doc.descripcion}</p>
                              </div>
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

      {/* Discrete Footer */}
      <footer className="mt-8 py-4 border-t border-gray-200 dark:border-gray-700 print:hidden">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-2 text-xs text-gray-500 dark:text-gray-400">
            <div className="flex items-center gap-4">
              <span>Generador de Documentos Medicos v3.0</span>
              <Link href="/historial" className="hover:text-gray-700 dark:hover:text-gray-300">Historial</Link>
              <Link href="/analitica" className="hover:text-gray-700 dark:hover:text-gray-300">Productividad</Link>
            </div>
            <LegalDisclaimer variant="compact" />
          </div>
        </div>
      </footer>
    </div>
  );
}
