'use client';

/**
 * Panel para mostrar el texto generado de la interconsulta
 *
 * Funcionalidades:
 * - Pestañas: Texto plano / Vista profesional
 * - Botón para copiar al portapapeles
 * - Botón para imprimir
 * - Selector de modos de IA y botón para mejorar
 * - Estados de carga y error
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
  icon: string;
}

export const AI_MODES: AIModeConfig[] = [
  {
    id: 'improve',
    label: 'Mejorar redacción',
    description: 'Mejora la claridad, ortografía y estilo del texto',
    icon: '✍️',
  },
  {
    id: 'format',
    label: 'Formato profesional',
    description: 'Reestructura el texto con formato de informe médico',
    icon: '📋',
  },
  {
    id: 'summarize',
    label: 'Resumir',
    description: 'Genera un resumen conciso manteniendo la información clave',
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
      <div className="h-full flex flex-col">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
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
    <div className="h-full flex flex-col">
      {/* Header con título y botones */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-4">
        <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
          Documento Generado
        </h2>

        <div className="flex flex-wrap gap-2 print:hidden">
          {/* Botón Copiar */}
          <button
            onClick={handleCopy}
            disabled={!text}
            className={`px-3 py-2 text-sm font-medium rounded-lg transition-colors flex items-center gap-2 ${
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
            className="px-3 py-2 text-sm font-medium rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600 transition-colors flex items-center gap-2 disabled:opacity-50"
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

      {/* Pestañas de vista */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-4 print:hidden">
        <button
          onClick={() => setActiveTab('plain')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'plain'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            Texto Plano
          </span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
            activeTab === 'preview'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-2">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Vista Profesional
          </span>
        </button>
      </div>

      {/* Error de copia */}
      {copyError && (
        <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm">
          {copyError}
        </div>
      )}

      {/* Contenido según pestaña activa */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'plain' ? (
          <pre className="h-full overflow-auto p-4 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono print:bg-white print:border-none">
            {text}
          </pre>
        ) : (
          <div className="h-full overflow-auto">
            <DocumentPreview
              formData={formData}
              plainText={text}
              documentType="interconsulta"
            />
          </div>
        )}
      </div>

      {/* Sección de IA */}
      {aiAvailable && onEnhance && (
        <div className="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 print:hidden">
          <div className="flex flex-col sm:flex-row gap-3">
            {/* Selector de modo de IA */}
            <div className="flex-1">
              <label className="block text-xs text-gray-500 dark:text-gray-400 mb-1">
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
              <p className="mt-1 text-xs text-gray-400 dark:text-gray-500">
                {AI_MODES.find(m => m.id === selectedAIMode)?.description}
              </p>
            </div>

            {/* Botón Aplicar IA */}
            <div className="flex items-end">
              <button
                onClick={handleEnhance}
                disabled={enhancing || !text}
                className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 dark:bg-purple-700 dark:hover:bg-purple-600 transition-colors flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    Procesando...
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
                    Aplicar IA
                  </>
                )}
              </button>
            </div>
          </div>

          {/* Aviso sobre IA */}
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-400 italic flex items-center gap-1">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            La IA solo mejora la redacción y el formato. No añade información clínica nueva.
          </p>
        </div>
      )}
    </div>
  );
}
