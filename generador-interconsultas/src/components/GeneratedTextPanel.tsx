'use client';

/**
 * Panel para mostrar el texto generado de la interconsulta
 *
 * Funcionalidades:
 * - Pestañas: Texto plano / Vista profesional / Checklist / Comparación IA
 * - Botón para copiar al portapapeles
 * - Botón para imprimir
 * - Selector de modos de IA y botón para mejorar con tooltips
 * - Estados de carga y error
 * - Control de scroll interno para contenido largo
 * - Checklist de revisión por servicio
 * - Vista diff para comparar texto original vs mejorado con IA
 */

import { useState, useEffect, useCallback } from 'react';
import DocumentPreview from './DocumentPreview';
import { InterconsultaFormData } from '@/types';
import { getChecklistForServicio, ChecklistItem } from '@/data/checklists';
import { compareTexts, DiffResult, getSegmentClassName } from '@/lib/textDiff';

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
    label: 'Mejorar redaccion',
    description: 'Mejora la claridad, ortografia y estilo del texto sin cambiar la informacion clinica.',
    shortDesc: 'Mejora redaccion sin cambiar la informacion clinica.',
    icon: 'improve',
  },
  {
    id: 'format',
    label: 'Formato profesional',
    description: 'Reorganiza el texto en secciones claras siguiendo el formato de informe medico estandar, sin anadir contenido nuevo.',
    shortDesc: 'Reorganiza el texto en secciones claras, sin anadir contenido nuevo.',
    icon: 'format',
  },
  {
    id: 'summarize',
    label: 'Resumir',
    description: 'Crea un resumen conciso de la interconsulta para otros profesionales, manteniendo la informacion clave.',
    shortDesc: 'Crea un resumen conciso para otros profesionales.',
    icon: 'summarize',
  },
];

interface GeneratedTextPanelProps {
  text: string;
  formData?: InterconsultaFormData;
  onEnhance?: (mode: AIMode) => Promise<void>;
  aiAvailable?: boolean;
  enhancing?: boolean;
  originalText?: string; // Texto antes de mejora con IA (para diff)
  servicioDestino?: string; // Para cargar checklist específica
}

type ViewTab = 'plain' | 'preview' | 'checklist' | 'diff';

export default function GeneratedTextPanel({
  text,
  formData,
  onEnhance,
  aiAvailable = false,
  enhancing = false,
  originalText,
  servicioDestino,
}: GeneratedTextPanelProps) {
  const [copied, setCopied] = useState(false);
  const [copyError, setCopyError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<ViewTab>('plain');
  const [selectedAIMode, setSelectedAIMode] = useState<AIMode>('improve');
  const [checklist, setChecklist] = useState<ChecklistItem[]>([]);
  const [checklistStates, setChecklistStates] = useState<Record<string, boolean>>({});
  const [diffResult, setDiffResult] = useState<DiffResult | null>(null);
  const [isPrinting, setIsPrinting] = useState(false);

  // Cargar checklist cuando cambia el servicio
  useEffect(() => {
    if (servicioDestino) {
      const checklistData = getChecklistForServicio(servicioDestino);
      setChecklist(checklistData.items);
      // Inicializar estados de checklist
      const initialStates: Record<string, boolean> = {};
      checklistData.items.forEach(item => {
        initialStates[item.id] = false;
      });
      setChecklistStates(initialStates);
    }
  }, [servicioDestino]);

  // Calcular diff cuando hay texto original y mejorado
  useEffect(() => {
    if (originalText && text && originalText !== text) {
      const result = compareTexts(originalText, text);
      setDiffResult(result);
    } else {
      setDiffResult(null);
    }
  }, [originalText, text]);

  // Imprimir documento - cambia a vista profesional primero
  const handlePrint = useCallback(() => {
    setIsPrinting(true);
    setActiveTab('preview');
    // Esperar al menos un ciclo de render antes de imprimir
    requestAnimationFrame(() => {
      setTimeout(() => {
        window.print();
        setIsPrinting(false);
      }, 150);
    });
  }, []);

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

  // Toggle checklist item
  const toggleChecklistItem = (id: string) => {
    setChecklistStates(prev => ({
      ...prev,
      [id]: !prev[id],
    }));
  };

  // Contar items completados
  const checklistCompleted = Object.values(checklistStates).filter(Boolean).length;
  const checklistTotal = checklist.length;

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
            <p className="mt-2 text-xs text-gray-400 dark:text-gray-500">
              Atajo: <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-xs">Ctrl+Enter</kbd>
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
            title="Copiar al portapapeles (Ctrl+C)"
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
            disabled={!text || isPrinting}
            title="Imprimir documento (cambia a vista profesional)"
            className={`px-3 py-1.5 text-sm font-medium rounded-lg transition-colors flex items-center gap-1.5 disabled:opacity-50 ${
              isPrinting
                ? 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600'
            }`}
          >
            {isPrinting ? (
              <>
                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span className="hidden sm:inline">Preparando...</span>
              </>
            ) : (
              <>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z"
                  />
                </svg>
                <span className="hidden sm:inline">Imprimir</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Pestañas de vista (fijas) */}
      <div className="flex border-b border-gray-200 dark:border-gray-700 mb-3 print:hidden shrink-0 overflow-x-auto">
        <button
          onClick={() => setActiveTab('plain')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'plain'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h7" />
            </svg>
            <span className="hidden sm:inline">Texto</span>
          </span>
        </button>
        <button
          onClick={() => setActiveTab('preview')}
          className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
            activeTab === 'preview'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span className="hidden sm:inline">Vista</span>
          </span>
        </button>

        {/* Tab Checklist - solo si hay checklist */}
        {checklist.length > 0 && (
          <button
            onClick={() => setActiveTab('checklist')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'checklist'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
              <span className="hidden sm:inline">Checklist</span>
              {checklistTotal > 0 && (
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  checklistCompleted === checklistTotal
                    ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                    : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
                }`}>
                  {checklistCompleted}/{checklistTotal}
                </span>
              )}
            </span>
          </button>
        )}

        {/* Tab Diff - solo si hay comparación disponible */}
        {diffResult && (
          <button
            onClick={() => setActiveTab('diff')}
            className={`px-3 py-2 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${
              activeTab === 'diff'
                ? 'border-purple-500 text-purple-600 dark:text-purple-400'
                : 'border-transparent text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12m0 0l-4-4m4 4l-4 4m0 6H4m0 0l4 4m-4-4l4-4" />
              </svg>
              <span className="hidden sm:inline">Cambios IA</span>
              <span className="text-xs px-1.5 py-0.5 rounded-full bg-purple-100 text-purple-700 dark:bg-purple-900/50 dark:text-purple-400">
                {diffResult.changedPercentage}%
              </span>
            </span>
          </button>
        )}
      </div>

      {/* Error de copia */}
      {copyError && (
        <div className="mb-3 p-2.5 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg text-red-700 dark:text-red-300 text-sm shrink-0">
          {copyError}
        </div>
      )}

      {/* Contenido según pestaña activa - área con scroll */}
      <div className="flex-1 min-h-[300px] max-h-[calc(100vh-420px)] overflow-hidden rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50">
        {activeTab === 'plain' && (
          <pre className="h-full overflow-y-auto p-4 text-sm text-gray-800 dark:text-gray-200 whitespace-pre-wrap font-mono print:bg-white print:border-none">
            {text}
          </pre>
        )}

        {activeTab === 'preview' && (
          <div className="h-full overflow-y-auto p-3 sm:p-4 bg-slate-100 dark:bg-slate-800">
            <DocumentPreview
              formData={formData}
              plainText={text}
              documentType="interconsulta"
            />
          </div>
        )}

        {activeTab === 'checklist' && (
          <div className="h-full overflow-y-auto p-4">
            <div className="space-y-3">
              {/* Progress bar */}
              <div className="mb-4">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600 dark:text-gray-400">Progreso de revisión</span>
                  <span className={`font-medium ${
                    checklistCompleted === checklistTotal
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-gray-700 dark:text-gray-300'
                  }`}>
                    {checklistCompleted} de {checklistTotal}
                  </span>
                </div>
                <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    className={`h-full transition-all duration-300 ${
                      checklistCompleted === checklistTotal
                        ? 'bg-green-500'
                        : 'bg-blue-500'
                    }`}
                    style={{ width: `${(checklistCompleted / checklistTotal) * 100}%` }}
                  />
                </div>
              </div>

              {/* Checklist items */}
              {checklist.map(item => (
                <label
                  key={item.id}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors ${
                    checklistStates[item.id]
                      ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                      : 'bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={checklistStates[item.id] || false}
                    onChange={() => toggleChecklistItem(item.id)}
                    className="mt-0.5 h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <span className={`text-sm font-medium ${
                        checklistStates[item.id]
                          ? 'text-green-700 dark:text-green-300 line-through'
                          : 'text-gray-900 dark:text-gray-100'
                      }`}>
                        {item.texto}
                      </span>
                      {item.tipo === 'obligatorio' && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-100 text-red-700 dark:bg-red-900/50 dark:text-red-400 rounded">
                          Obligatorio
                        </span>
                      )}
                      {item.tipo === 'recomendado' && (
                        <span className="text-xs px-1.5 py-0.5 bg-amber-100 text-amber-700 dark:bg-amber-900/50 dark:text-amber-400 rounded">
                          Recomendado
                        </span>
                      )}
                    </div>
                  </div>
                </label>
              ))}

              {/* Mensaje cuando todo está completo */}
              {checklistCompleted === checklistTotal && checklistTotal > 0 && (
                <div className="mt-4 p-4 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center gap-2">
                    <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="text-sm font-medium text-green-700 dark:text-green-300">
                      Revisión completada
                    </span>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {activeTab === 'diff' && diffResult && (
          <div className="h-full overflow-y-auto p-4">
            {/* Stats de cambios */}
            <div className="mb-4 flex flex-wrap gap-3">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-green-100 dark:bg-green-900/30 rounded-lg">
                <span className="text-xs text-green-700 dark:text-green-300">
                  +{diffResult.addedCount} palabras añadidas
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-red-100 dark:bg-red-900/30 rounded-lg">
                <span className="text-xs text-red-700 dark:text-red-300">
                  -{diffResult.removedCount} palabras eliminadas
                </span>
              </div>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 rounded-lg">
                <span className="text-xs text-purple-700 dark:text-purple-300">
                  {diffResult.changedPercentage}% de cambio
                </span>
              </div>
            </div>

            {/* Diff view */}
            <div className="p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <p className="text-sm leading-relaxed">
                {diffResult.segments.map((segment, index) => (
                  <span
                    key={index}
                    className={`${getSegmentClassName(segment.type)} ${
                      segment.type !== 'equal' ? 'px-0.5 rounded' : ''
                    }`}
                  >
                    {segment.text}
                  </span>
                ))}
              </p>
            </div>

            {/* Leyenda */}
            <div className="mt-4 flex flex-wrap gap-4 text-xs text-gray-500 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-green-100 dark:bg-green-900/30 rounded"></span>
                <span>Texto añadido</span>
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-3 h-3 bg-red-100 dark:bg-red-900/30 rounded"></span>
                <span>Texto eliminado</span>
              </div>
            </div>
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
                    {mode.label}
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
