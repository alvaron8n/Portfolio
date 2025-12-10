'use client';

/**
 * Pagina de Historial Clinico
 *
 * Muestra todos los documentos generados con:
 * - Tabla con columnas: fecha, tipo, servicio, paciente
 * - Filtros por tipo de documento y servicio
 * - Acciones: ver, copiar, imprimir, eliminar
 */

import { useState, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { getHistorial, removeFromHistorial, clearHistorial, HistorialEntry } from '@/lib/historial';
import { getBranding, isColorDark } from '@/lib/branding';

// Document type labels
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  interconsulta: 'Interconsulta',
  'peticion-pruebas': 'Peticion de Pruebas',
  'nota-evolutiva': 'Nota Evolutiva',
  'informe-alta': 'Informe de Alta',
  'informe-social': 'Informe Social',
};

export default function HistorialPage() {
  const [historial, setHistorial] = useState<HistorialEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [branding, setBranding] = useState<ReturnType<typeof getBranding> | null>(null);

  // Filters
  const [filterTipo, setFilterTipo] = useState<string>('');
  const [filterServicio, setFilterServicio] = useState<string>('');
  const [searchText, setSearchText] = useState('');

  // Selected entry for detail view
  const [selectedEntry, setSelectedEntry] = useState<HistorialEntry | null>(null);
  const [copied, setCopied] = useState(false);

  // Load data on mount
  useEffect(() => {
    const data = getHistorial();
    setHistorial(data);
    setBranding(getBranding());
    setLoading(false);
  }, []);

  // Get unique document types and services for filters
  const { documentTypes, servicios } = useMemo(() => {
    const types = new Set<string>();
    const services = new Set<string>();

    historial.forEach(entry => {
      types.add(entry.tipoDocumento);
      const servicio = (entry.formData as { servicioDestino?: string })?.servicioDestino;
      if (servicio) services.add(servicio);
    });

    return {
      documentTypes: Array.from(types).sort(),
      servicios: Array.from(services).sort(),
    };
  }, [historial]);

  // Filtered historial
  const filteredHistorial = useMemo(() => {
    return historial.filter(entry => {
      if (filterTipo && entry.tipoDocumento !== filterTipo) return false;

      const servicio = (entry.formData as { servicioDestino?: string })?.servicioDestino;
      if (filterServicio && servicio !== filterServicio) return false;

      if (searchText) {
        const search = searchText.toLowerCase();
        const matchesTitle = entry.titulo.toLowerCase().includes(search);
        const matchesServicio = servicio?.toLowerCase().includes(search);
        const matchesPaciente = ((entry.formData as { paciente?: { nombre?: string } })?.paciente?.nombre || '').toLowerCase().includes(search);
        if (!matchesTitle && !matchesServicio && !matchesPaciente) return false;
      }

      return true;
    });
  }, [historial, filterTipo, filterServicio, searchText]);

  // Delete entry
  const handleDelete = (id: string) => {
    if (confirm('Eliminar este documento del historial?')) {
      removeFromHistorial(id);
      setHistorial(prev => prev.filter(e => e.id !== id));
      if (selectedEntry?.id === id) setSelectedEntry(null);
    }
  };

  // Clear all
  const handleClearAll = () => {
    if (confirm('Eliminar TODO el historial? Esta accion no se puede deshacer.')) {
      clearHistorial();
      setHistorial([]);
      setSelectedEntry(null);
    }
  };

  // Copy text
  const handleCopy = async (text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Error copying:', err);
    }
  };

  // Print document
  const handlePrint = (entry: HistorialEntry) => {
    if (!entry.textoGenerado) return;

    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
      <head>
        <title>${entry.titulo}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20mm; font-size: 12pt; line-height: 1.6; }
          pre { white-space: pre-wrap; font-family: inherit; }
        </style>
      </head>
      <body>
        <pre>${entry.textoGenerado}</pre>
      </body>
      </html>
    `);
    printWindow.document.close();
    printWindow.print();
  };

  // Format date
  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    return date.toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  // Get patient name from entry
  const getPatientName = (entry: HistorialEntry) => {
    return (entry.formData as { paciente?: { nombre?: string } })?.paciente?.nombre || '-';
  };

  // Get service from entry
  const getService = (entry: HistorialEntry) => {
    return (entry.formData as { servicioDestino?: string })?.servicioDestino || '-';
  };

  const brandColor = branding?.colorPrincipal || '#1e40af';
  const textOnBrand = isColorDark(brandColor) ? 'text-white' : 'text-gray-900';

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="animate-spin h-8 w-8 border-2 border-blue-600 border-t-transparent rounded-full"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-gray-900">
      {/* Header */}
      <header
        className="border-b border-gray-200 dark:border-gray-700"
        style={{ backgroundColor: brandColor }}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-14">
            <div className="flex items-center gap-3">
              <Link href="/" className={`p-2 rounded bg-white/10 hover:bg-white/20 transition-colors ${textOnBrand}`}>
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className={`text-sm font-semibold ${textOnBrand}`}>Historial de Documentos</h1>
                <p className={`text-xs ${textOnBrand} opacity-75`}>{historial.length} documentos guardados</p>
              </div>
            </div>

            {historial.length > 0 && (
              <button
                onClick={handleClearAll}
                className={`px-3 py-1.5 text-xs font-medium rounded bg-white/10 hover:bg-white/20 transition-colors ${textOnBrand}`}
              >
                Limpiar todo
              </button>
            )}
          </div>
        </div>
      </header>

      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
        {historial.length === 0 ? (
          /* Empty state */
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 className="mt-4 text-lg font-medium text-gray-900 dark:text-gray-100">Sin historial</h3>
            <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
              Los documentos generados apareceran aqui automaticamente.
            </p>
            <Link
              href="/"
              className="mt-4 inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded-lg bg-blue-600 text-white hover:bg-blue-700 transition-colors"
            >
              <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Crear documento
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* List column */}
            <div className="lg:col-span-2 space-y-4">
              {/* Filters */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                  {/* Search */}
                  <div className="sm:col-span-3">
                    <div className="relative">
                      <svg className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <input
                        type="text"
                        placeholder="Buscar por titulo, paciente o servicio..."
                        value={searchText}
                        onChange={(e) => setSearchText(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      />
                    </div>
                  </div>

                  {/* Type filter */}
                  <select
                    value={filterTipo}
                    onChange={(e) => setFilterTipo(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todos los tipos</option>
                    {documentTypes.map(type => (
                      <option key={type} value={type}>{DOCUMENT_TYPE_LABELS[type] || type}</option>
                    ))}
                  </select>

                  {/* Service filter */}
                  <select
                    value={filterServicio}
                    onChange={(e) => setFilterServicio(e.target.value)}
                    className="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">Todos los servicios</option>
                    {servicios.map(s => (
                      <option key={s} value={s}>{s}</option>
                    ))}
                  </select>

                  {/* Results count */}
                  <div className="flex items-center text-sm text-gray-500 dark:text-gray-400">
                    {filteredHistorial.length} de {historial.length} documentos
                  </div>
                </div>
              </div>

              {/* Table */}
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50 dark:bg-gray-700/50">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Tipo
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden sm:table-cell">
                          Servicio
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider hidden md:table-cell">
                          Paciente
                        </th>
                        <th className="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                          Acciones
                        </th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200 dark:divide-gray-700">
                      {filteredHistorial.map(entry => (
                        <tr
                          key={entry.id}
                          onClick={() => setSelectedEntry(entry)}
                          className={`hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition-colors ${
                            selectedEntry?.id === entry.id ? 'bg-blue-50 dark:bg-blue-900/20' : ''
                          }`}
                        >
                          <td className="px-4 py-3 text-sm text-gray-900 dark:text-gray-100 whitespace-nowrap">
                            {formatDate(entry.timestamp)}
                          </td>
                          <td className="px-4 py-3 text-sm">
                            <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/50 dark:text-blue-300">
                              {DOCUMENT_TYPE_LABELS[entry.tipoDocumento] || entry.tipoDocumento}
                            </span>
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden sm:table-cell">
                            {getService(entry)}
                          </td>
                          <td className="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 hidden md:table-cell">
                            {getPatientName(entry)}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <div className="flex items-center justify-end gap-1">
                              {entry.textoGenerado && (
                                <>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handleCopy(entry.textoGenerado!); }}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    title="Copiar"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                    </svg>
                                  </button>
                                  <button
                                    onClick={(e) => { e.stopPropagation(); handlePrint(entry); }}
                                    className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
                                    title="Imprimir"
                                  >
                                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                                    </svg>
                                  </button>
                                </>
                              )}
                              <button
                                onClick={(e) => { e.stopPropagation(); handleDelete(entry.id); }}
                                className="p-1.5 text-gray-400 hover:text-red-600 dark:hover:text-red-400 transition-colors"
                                title="Eliminar"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>

                {filteredHistorial.length === 0 && (
                  <div className="p-8 text-center text-gray-500 dark:text-gray-400">
                    No se encontraron documentos con los filtros actuales.
                  </div>
                )}
              </div>
            </div>

            {/* Detail panel */}
            <div className="lg:col-span-1">
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 sticky top-4">
                {selectedEntry ? (
                  <div className="space-y-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <h3 className="text-sm font-semibold text-gray-900 dark:text-gray-100">
                          {DOCUMENT_TYPE_LABELS[selectedEntry.tipoDocumento] || selectedEntry.tipoDocumento}
                        </h3>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(selectedEntry.timestamp)}
                        </p>
                      </div>
                      <button
                        onClick={() => setSelectedEntry(null)}
                        className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                      </button>
                    </div>

                    <div className="space-y-2 text-sm">
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Servicio:</span>
                        <span className="text-gray-900 dark:text-gray-100">{getService(selectedEntry)}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500 dark:text-gray-400">Paciente:</span>
                        <span className="text-gray-900 dark:text-gray-100">{getPatientName(selectedEntry)}</span>
                      </div>
                    </div>

                    {selectedEntry.textoGenerado && (
                      <>
                        <div className="border-t border-gray-200 dark:border-gray-700 pt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-xs font-medium text-gray-500 dark:text-gray-400">Texto generado</span>
                            <button
                              onClick={() => handleCopy(selectedEntry.textoGenerado!)}
                              className="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                            >
                              {copied ? 'Copiado!' : 'Copiar'}
                            </button>
                          </div>
                          <pre className="text-xs text-gray-700 dark:text-gray-300 whitespace-pre-wrap max-h-64 overflow-y-auto bg-gray-50 dark:bg-gray-700/50 rounded p-3">
                            {selectedEntry.textoGenerado}
                          </pre>
                        </div>

                        <div className="flex gap-2">
                          <button
                            onClick={() => handlePrint(selectedEntry)}
                            className="flex-1 px-3 py-2 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors flex items-center justify-center gap-1.5"
                          >
                            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                            </svg>
                            Imprimir
                          </button>
                          <button
                            onClick={() => handleDelete(selectedEntry.id)}
                            className="px-3 py-2 text-xs font-medium rounded-lg text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition-colors"
                          >
                            Eliminar
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <svg className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
                      Selecciona un documento para ver los detalles
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}
