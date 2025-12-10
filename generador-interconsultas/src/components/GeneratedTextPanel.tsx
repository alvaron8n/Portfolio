'use client';

/**
 * Panel para mostrar el texto generado de la interconsulta
 *
 * Funcionalidades:
 * - Pestañas: Texto plano / Vista profesional
 * - Botón para copiar al portapapeles
 * - Botón para imprimir
 * - Selector de modos de IA y botón para mejorar con tooltips
 * - Estados de carga y error
 * - Control de scroll interno para contenido largo
 */

import { useState } from 'react';
import DocumentPreview from './DocumentPreview';
import { InterconsultaFormData } from '@/types';

// Modos de IA disponibles
export type AIMode = 'improve' | 'format' | 'summarize';

export interface AIModeConfig {
  id: AIMode;
  label: string;
  description: string;
  shortDesc: string; // Descripción corta para tooltips
  icon: string;
}

export const AI_MODES: AIModeConfig[] = [
  {
    id: 'improve',
    label: 'Mejorar redacción',
    description: 'Mejora la claridad, ortografía y estilo del texto sin cambiar la información clínica.',
    shortDesc: 'Mejora redacción sin cambiar la información clínica.',
    icon: '✍️',
  },
  {
    id: 'format',
    label: 'Formato profesional',
    description: 'Reorganiza el texto en secciones claras siguiendo el formato de informe médico estándar, sin añadir contenido nuevo.',
    shortDesc: 'Reorganiza el texto en secciones claras, sin añadir contenido nuevo.',
    icon: '📋',
  },
  {
    id: 'summarize',
    label: 'Resumir',
    description: 'Crea un resumen conciso de la interconsulta para otros profesionales, manteniendo la información clave.',
    shortDesc: 'Crea un resumen conciso para otros profesionales.',
    icon: '📝',
  },
];

interface GeneratedTextPanelProps {
  text: string;
  formData?: InterconsultaFormData;
  onEnhance?: (mode: AIMode) => Promise<void>;
  aiAvailable?: boolean;
  enhancing?: boolean;
}

type ViewTab = 'plain' | 'preview';

export default function GeneratedTextPanel({
  text,
  formData,
  onEnhance,
  aiAvailable = false,
  enhancing = false,
}: GeneratedTextPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('plain');
  const [selectedAIMode, setSelectedAIMode] = useState<AIMode>('improve');

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
      setTimeout(() => setCopied(false), 2000);
    } catch (error) {
      console.error('Error al copiar:', error);
      setCopyError('No se pudo copiar al portapapeles');
      setTimeout(() => setCopyError(null), 3000);
    }
  };

  // Manejar mejora con IA
  const handleEnhance = async () => {
    if (onEnhance) {
      await onEnhance(selectedAIMode);
    }
  };

  // Si no hay texto, mostrar estado vacío
  if (!text) {
    return (
      <div className="flex flex-col min-h-[400px]">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4 shrink-0">
          Documento Generado
        </h2>

        <div className="flex-1 flex items-center justify-center border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-8">
          <div className="text-center">
            <svg
              className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500"
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
            <p className="mt-4 text-gray-500 dark:text-gray-400">
              Rellene el formulario y pulse &quot;Generar Interconsulta&quot;
              para ver el documento aquí.
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header fijo con título y botones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4 shrink-0">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Documento Generado
        </h2>

        <div className="flex flex-wrap gap-2 print:hidden">
          {/* Botón Copiar */}
          <button
            onClick={handleCopy}
            disabled={!text}
            title="Copiar al portapapeles"
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 ${
              copied
                ? 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {copied ? (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                <span className="hidden sm:inline">Copiado</span>
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
                <span className="hidden sm:inline">Copiar</span>
              </>
            )}
          </button>

          {/* Botón Imprimir */}
          <button
            onClick={handlePrint}
            disabled={!text}
            title="Imprimir documento"
            className="px-3 py-1.5 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-1.5 disabled:opacity-50"
          >
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
              />
            </svg>
            <span className="hidden sm:inline">Imprimir</span>
          </button>
        </div>
      </div>

      {/* Pestañas de vista (fijas) */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3 print:hidden shrink-0">
        <button
          onClick={() => setActiveTab('plain')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'plain'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="hidden sm:inline">Texto Plano</span>
            <span className="sm:hidden">Texto</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Vista Profesional</span>
            <span className="sm:hidden">Vista</span>
          </span>
        </button>
      </div>

      {/* Error de copia */}
      {copyError && (
        <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm shrink-0">
          {copyError}
        </div>
      )}

      {/* Contenido según pestaña activa - área con scroll */}
      <div className="flex-1 min-h-[300px] max-h-[calc(100vh-420px)] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {activeTab === 'plain' ? (
          <pre className="h-full overflow-y-auto p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono print:bg-white print:border-none">
            {text}
          </pre>
        ) : (
          <div className="h-full overflow-y-auto p-3 sm:p-4 bg-slate-100 dark:bg-slate-800">
            <DocumentPreview
              formData={formData}
              plainText={text}
              documentType="interconsulta"
            />
          </div>
        )}
      </div>

      {/* Sección de IA (fija en la parte inferior) */}
      {aiAvailable && onEnhance && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 print:hidden shrink-0">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Selector de modo de IA con descripción */}
            <div className="flex-1">
              <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">
                Modo de IA
              </label>
              <select
                value={selectedAIMode}
                onChange={(e) => setSelectedAIMode(e.target.value as AIMode)}
                disabled={enhancing}
                className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-purple-500 focus:border-purple-500 disabled:opacity-50"
              >
                {AI_MODES.map((mode) => (
                  <option key={mode.id} value={mode.id}>
                    {mode.icon} {mode.label}
                  </option>
                ))}
              </select>
              {/* Descripción del modo seleccionado */}
              <p className="mt-1.5 text-[11px] text-gray-400 dark:text-gray-500 leading-relaxed">
                {AI_MODES.find(m => m.id === selectedAIMode)?.shortDesc}
              </p>
            </div>

            {/* Botón Aplicar IA */}
            <div className="flex items-start sm:pt-5">
              <button
                onClick={handleEnhance}
                disabled={enhancing || !text}
                title="Aplicar mejora con IA"
                className="w-full sm:w-auto px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    <span>Procesando...</span>
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
                    <span>Aplicar IA</span>
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Aviso sobre IA */}
          <p className="mt-2.5 text-[11px] text-gray-500 dark:text-gray-400 italic flex items-start gap-1.5">
            <svg className="h-3.5 w-3.5 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>La IA solo mejora la redacción y el formato. Nunca añade diagnósticos, datos clínicos ni información nueva.</span>
          </p>
        </div>
      )}
    </div>
  );
}
