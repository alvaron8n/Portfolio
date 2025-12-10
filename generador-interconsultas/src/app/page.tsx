'use client';

/**
 * Página principal: Generador de Interconsultas
 *
 * Layout moderno SaaS con:
 * - Hero section con gradiente y branding personalizable
 * - Modo Consulta Rápida para visitas de 5-10 min
 * - Formulario de interconsulta con frases rápidas
 * - Panel de texto generado con checklist y comparación IA
 * - Wizard multi-documento
 * - Integración con IA y webhooks
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
import { trackDocumentGenerated } from '@/lib/analytics';
import { addToHistorial, generateTitulo } from '@/lib/historial';
import { createCase, setCurrentCase, DOCUMENT_TYPES } from '@/lib/caseManager';
import Link from 'next/link';

export default function HomePage() {
  const [generatedText, setGeneratedText] = useState('');
  const [originalText, setOriginalText] = useState(''); // Para comparación IA
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
  const [currentCaseId, setCurrentCaseId] = useState<string | null>(null);

  // Branding
  const [branding, setBranding] = useState(getBranding());

  // Success message
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Cargar configuraciones al iniciar
  useEffect(() => {
    const config = getQuickModeConfig();
    setQuickMode(config.enabled);
    setBranding(getBranding());
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
      // Ctrl+M: Toggle quick mode
      if ((e.ctrlKey || e.metaKey) && e.key === 'm') {
        e.preventDefault();
        handleToggleQuickMode();
      }
      // Ctrl+S: Save draft
      if ((e.ctrlKey || e.metaKey) && e.key === 's') {
        e.preventDefault();
        handleSaveDraft();
      }
      // Ctrl+L: Clear form (with confirmation)
      if ((e.ctrlKey || e.metaKey) && e.key === 'l') {
        e.preventDefault();
        handleClearForm();
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [formData, generatedText]);

  // Toggle quick mode
  const handleToggleQuickMode = useCallback(() => {
    const newState = toggleQuickMode();
    setQuickMode(newState);
  }, []);

  // Save draft to history
  const handleSaveDraft = useCallback(() => {
    if (!formData) return;

    const titulo = generateTitulo(
      'interconsulta',
      formData.paciente.nombre,
      formData.servicioDestino
    );
    addToHistorial('interconsulta', titulo, formData as unknown as Record<string, unknown>, generatedText);
    showSuccess('Borrador guardado en historial');
  }, [formData, generatedText]);

  // Clear form
  const handleClearForm = useCallback(() => {
    if (formData && (formData.paciente.nombre || formData.informacionClinica.motivoPrincipal)) {
      if (confirm('¿Limpiar todos los campos del formulario?')) {
        window.location.reload();
      }
    }
  }, [formData]);

  // Show success message
  const showSuccess = (message: string) => {
    setSuccessMessage(message);
    setTimeout(() => setSuccessMessage(null), 3000);
  };

  // Handle auto-draft in quick mode
  const handleAutoDraft = useCallback((data: InterconsultaFormData) => {
    const plantilla = getPlantilla('interconsulta');
    const text = buildInterconsultaText(data, plantilla || undefined);
    setAutoDraft(text);
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
        setTimeout(() => setWebhookWarning(null), 8000);
      } else if (result.sent) {
        setWebhookWarning(null);
      }
    } catch (err) {
      console.warn('Error enviando webhook:', err);
      setWebhookWarning('El documento se generó correctamente, pero hubo un error de conexión con el webhook.');
      setTimeout(() => setWebhookWarning(null), 8000);
    }
  };

  // Generar el texto de la interconsulta
  const handleGenerate = async (data: InterconsultaFormData) => {
    setLoading(true);
    setError(null);

    try {
      const plantilla = getPlantilla('interconsulta');
      const text = buildInterconsultaText(data, plantilla || undefined);
      setGeneratedText(text);
      setOriginalText(text); // Store for comparison
      setFormData(data);
      setAutoDraft('');

      // Track analytics
      trackDocumentGenerated('interconsulta', data.servicioDestino, text.length, false);

      // Save to history
      const titulo = generateTitulo('interconsulta', data.paciente.nombre, data.servicioDestino);
      addToHistorial('interconsulta', titulo, data as unknown as Record<string, unknown>, text);

      // Send webhook
      await sendToWebhook(data, text);

      showSuccess('Documento generado correctamente');
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
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ text: generatedText, mode }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al mejorar el texto');
      }

      setGeneratedText(data.text);

      // Track AI usage
      if (formData) {
        trackDocumentGenerated('interconsulta', formData.servicioDestino, data.text.length, true);
      }
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

  // Create case for multi-document
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
    setCurrentCaseId(caseData.id);
    setShowMultiDocMenu(true);
  };

  // Get branding colors
  const brandColor = branding.colorPrincipal || '#2563eb';
  const textOnBrand = isColorDark(brandColor) ? 'text-white' : 'text-gray-900';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Hero Section with Branding */}
      <div
        className="text-white"
        style={{ background: `linear-gradient(135deg, ${brandColor} 0%, ${brandColor}dd 100%)` }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-12">
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
            <div className="text-center sm:text-left">
              {/* Logo/Branding */}
              {hasBranding() && branding.mostrarEnHeader && (
                <div className="flex items-center gap-3 mb-2">
                  {branding.logoUrl && (
                    <img src={branding.logoUrl} alt="" className="h-10 w-10 rounded" />
                  )}
                  <div>
                    <p className={`text-sm font-medium ${textOnBrand} opacity-90`}>
                      {branding.nombreCentro}
                    </p>
                    {branding.subtitulo && (
                      <p className={`text-xs ${textOnBrand} opacity-70`}>{branding.subtitulo}</p>
                    )}
                  </div>
                </div>
              )}

              <h1 className={`text-2xl sm:text-3xl lg:text-4xl font-bold mb-2 ${textOnBrand}`}>
                Generador de Interconsultas
              </h1>
              <p className={`${textOnBrand} opacity-90 text-sm sm:text-base max-w-xl`}>
                Reduce el tiempo de documentación repetitiva y estandariza tus informes.
                {aiAvailable && ' Con mejora opcional por IA.'}
              </p>
            </div>

            {/* Quick Actions */}
            <div className="flex flex-wrap items-center gap-2">
              {/* Quick Mode Toggle */}
              <button
                onClick={handleToggleQuickMode}
                className={`px-3 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 ${
                  quickMode
                    ? 'bg-white/20 text-white ring-2 ring-white/50'
                    : 'bg-white/10 text-white/90 hover:bg-white/20'
                }`}
                title="Ctrl+M"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="hidden sm:inline">Consulta Rápida</span>
                <span className="sm:hidden">Rápido</span>
                {quickMode && <span className="text-xs bg-white/30 px-1.5 py-0.5 rounded">ON</span>}
              </button>

              {/* Analytics Link */}
              <Link
                href="/analitica"
                className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/90 hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span className="hidden sm:inline">Analítica</span>
              </Link>

              {/* Config Link */}
              <Link
                href="/configuracion"
                className="px-3 py-2 rounded-lg text-sm font-medium bg-white/10 text-white/90 hover:bg-white/20 transition-colors flex items-center gap-2"
              >
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                <span className="hidden sm:inline">Configuración</span>
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Mode Indicator */}
      {quickMode && (
        <div className="bg-amber-50 dark:bg-amber-900/30 border-b border-amber-200 dark:border-amber-800">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-2">
            <div className="flex items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-amber-800 dark:text-amber-200">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
                <span className="text-sm font-medium">Modo Consulta Rápida</span>
                <span className="text-xs text-amber-600 dark:text-amber-400">
                  — se muestran solo los campos esenciales
                </span>
              </div>
              <button
                onClick={handleToggleQuickMode}
                className="text-xs text-amber-700 dark:text-amber-300 hover:underline"
              >
                Desactivar
              </button>
            </div>
          </div>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 -mt-4">
        {/* Legal Disclaimer */}
        <div className="mb-4">
          <LegalDisclaimer />
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="mb-4 p-3 bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded-lg flex items-center gap-2 text-green-700 dark:text-green-300 text-sm">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            {successMessage}
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-red-600 dark:text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p className="text-red-700 dark:text-red-300">{error}</p>
            </div>
            <button
              onClick={() => setError(null)}
              className="mt-2 text-sm text-red-600 dark:text-red-400 hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Webhook Warning */}
        {webhookWarning && (
          <div className="mb-4 p-4 bg-amber-50 dark:bg-amber-900/30 border border-amber-200 dark:border-amber-800 rounded-lg">
            <div className="flex items-center gap-2">
              <svg className="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <p className="text-amber-700 dark:text-amber-300 text-sm">{webhookWarning}</p>
            </div>
            <button
              onClick={() => setWebhookWarning(null)}
              className="mt-2 text-sm text-amber-600 dark:text-amber-400 hover:underline"
            >
              Cerrar
            </button>
          </div>
        )}

        {/* Auto Draft in Quick Mode */}
        {quickMode && autoDraft && (
          <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
            <div className="flex items-start justify-between gap-2 mb-2">
              <div className="flex items-center gap-2 text-blue-700 dark:text-blue-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
                </svg>
                <span className="text-sm font-medium">Borrador autogenerado</span>
              </div>
              <span className="text-xs text-blue-500 dark:text-blue-400">
                Pulsa &quot;Generar&quot; para la versión final
              </span>
            </div>
            <pre className="text-xs text-blue-800 dark:text-blue-200 whitespace-pre-wrap max-h-32 overflow-y-auto bg-white/50 dark:bg-gray-800/50 rounded p-2">
              {autoDraft.substring(0, 500)}{autoDraft.length > 500 ? '...' : ''}
            </pre>
          </div>
        )}

        {/* Main Layout */}
        <div className={`grid gap-6 ${quickMode ? 'grid-cols-1' : 'grid-cols-1 lg:grid-cols-2'}`}>
          {/* Form Column */}
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6">
            <div className="flex items-center justify-between gap-3 mb-4 sm:mb-6">
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                  <svg className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <div>
                  <h2 className="text-lg sm:text-xl font-semibold text-gray-900 dark:text-gray-100">
                    Datos de la Interconsulta
                  </h2>
                  {quickMode && (
                    <p className="text-xs text-gray-500 dark:text-gray-400">Campos esenciales</p>
                  )}
                </div>
              </div>

              {/* Keyboard Shortcuts Hint */}
              <div className="hidden sm:flex items-center gap-1 text-xs text-gray-400">
                <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px]">Ctrl+Enter</kbd>
                <span>generar</span>
              </div>
            </div>
            <InterconsultaForm
              onGenerate={handleGenerate}
              loading={loading}
              quickMode={quickMode}
              onAutoGenerate={handleAutoDraft}
            />
          </div>

          {/* Generated Text Column - Hidden in quick mode when no text */}
          {(!quickMode || generatedText) && (
            <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg border border-gray-200 dark:border-gray-700 p-4 sm:p-6 lg:sticky lg:top-4 lg:h-fit lg:max-h-[calc(100vh-4rem)]">
              <GeneratedTextPanel
                text={generatedText}
                originalText={originalText}
                formData={formData}
                onEnhance={handleEnhance}
                aiAvailable={aiAvailable}
                enhancing={enhancing}
              />

              {/* Multi-Document Actions */}
              {generatedText && formData && (
                <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div className="relative">
                    <button
                      onClick={() => setShowMultiDocMenu(!showMultiDocMenu)}
                      className="w-full px-4 py-2 text-sm font-medium rounded-lg bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 hover:bg-indigo-100 dark:hover:bg-indigo-900/50 transition-colors flex items-center justify-center gap-2"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                      Crear otro documento con estos datos
                      <svg className={`h-4 w-4 transition-transform ${showMultiDocMenu ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </button>

                    {showMultiDocMenu && (
                      <div className="absolute bottom-full left-0 right-0 mb-2 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 p-2 z-10">
                        <p className="text-xs text-gray-500 dark:text-gray-400 px-2 mb-2">
                          Generar otro documento con los mismos datos del paciente:
                        </p>
                        <div className="space-y-1">
                          {DOCUMENT_TYPES.filter(d => d.id !== 'interconsulta').map(doc => (
                            <Link
                              key={doc.id}
                              href={doc.ruta}
                              onClick={handleCreateCase}
                              className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors"
                            >
                              <span className="text-lg">{doc.icon}</span>
                              <div>
                                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">
                                  {doc.nombre}
                                </p>
                                <p className="text-xs text-gray-500 dark:text-gray-400">
                                  {doc.descripcion}
                                </p>
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

        {/* Feature Cards */}
        <div className="mt-8 sm:mt-12 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-2.5 bg-green-100 dark:bg-green-900/50 rounded-lg w-fit mb-3">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base">Formato Estandarizado</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Documentos con estructura profesional siguiendo estándares médicos.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-2.5 bg-purple-100 dark:bg-purple-900/50 rounded-lg w-fit mb-3">
              <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base">Modo Consulta Rápida</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Flujo optimizado para visitas de 5-10 minutos.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-2.5 bg-blue-100 dark:bg-blue-900/50 rounded-lg w-fit mb-3">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base">Frases Rápidas</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Biblioteca personal de textos frecuentes.
            </p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-4 sm:p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="p-2.5 bg-amber-100 dark:bg-amber-900/50 rounded-lg w-fit mb-3">
              <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <h3 className="font-semibold text-gray-900 dark:text-gray-100 mb-1 text-sm sm:text-base">100% Privado</h3>
            <p className="text-xs sm:text-sm text-gray-600 dark:text-gray-400">
              Tus datos nunca salen del navegador.
            </p>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 sm:mt-12 text-center text-xs sm:text-sm text-gray-500 dark:text-gray-400">
          <p>
            Generador de Documentos Médicos v2.1 &middot;{' '}
            <Link href="/analitica" className="hover:underline">Ver mi productividad</Link>
          </p>
          <LegalDisclaimer variant="compact" />
        </footer>
      </div>
    </div>
  );
}
