'use client';

/**
 * Página de Analítica de Uso
 *
 * Muestra estadísticas de productividad del médico:
 * - Total de documentos generados
 * - Desglose por tipo y servicio
 * - Estimación de tiempo ahorrado
 */

import { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  getEstadisticasGenerales,
  getResumenUltimosDias,
  getResumenPorServicio,
  getResumenPorTipo,
  getTiempoAhorradoEstimado,
} from '@/lib/analytics';

export default function AnaliticaPage() {
  const [stats, setStats] = useState<ReturnType<typeof getEstadisticasGenerales> | null>(null);
  const [ultimos7Dias, setUltimos7Dias] = useState<ReturnType<typeof getResumenUltimosDias> | null>(null);
  const [porServicio, setPorServicio] = useState<ReturnType<typeof getResumenPorServicio>>([]);
  const [porTipo, setPorTipo] = useState<ReturnType<typeof getResumenPorTipo>>([]);
  const [tiempoAhorrado, setTiempoAhorrado] = useState<ReturnType<typeof getTiempoAhorradoEstimado> | null>(null);

  useEffect(() => {
    setStats(getEstadisticasGenerales());
    setUltimos7Dias(getResumenUltimosDias(7));
    setPorServicio(getResumenPorServicio());
    setPorTipo(getResumenPorTipo());
    setTiempoAhorrado(getTiempoAhorradoEstimado());
  }, []);

  const maxDiario = ultimos7Dias?.porDia.reduce((max, d) => Math.max(max, d.total), 0) || 1;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-900 text-white">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-blue-200 hover:text-white mb-2 inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al generador
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold">Mi Productividad</h1>
              <p className="text-blue-100 mt-1">Estadísticas de uso de la herramienta</p>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 dark:bg-blue-900/50 rounded-lg">
                <svg className="h-5 w-5 text-blue-600 dark:text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.totalDocumentos || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Documentos generados</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg">
                <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{tiempoAhorrado?.descripcion || '0 min'}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Tiempo estimado ahorrado</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 dark:bg-purple-900/50 rounded-lg">
                <svg className="h-5 w-5 text-purple-600 dark:text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.porcentajeIA || 0}%</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Mejorados con IA</p>
              </div>
            </div>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-xl p-5 border border-gray-200 dark:border-gray-700 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-lg">
                <svg className="h-5 w-5 text-amber-600 dark:text-amber-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{stats?.diasActivo || 0}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">Días con actividad</p>
              </div>
            </div>
          </div>
        </div>

        {/* Chart: Last 7 days */}
        <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm mb-8">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Últimos 7 días</h2>
          <div className="flex items-end gap-2 h-32">
            {ultimos7Dias?.porDia.map((dia, index) => {
              const height = maxDiario > 0 ? (dia.total / maxDiario) * 100 : 0;
              const fecha = new Date(dia.fecha);
              const diaNombre = fecha.toLocaleDateString('es-ES', { weekday: 'short' });
              return (
                <div key={index} className="flex-1 flex flex-col items-center gap-1">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{dia.total}</span>
                  <div
                    className="w-full bg-blue-500 dark:bg-blue-600 rounded-t transition-all"
                    style={{ height: `${Math.max(height, 4)}%` }}
                  />
                  <span className="text-xs text-gray-500 dark:text-gray-400 capitalize">{diaNombre}</span>
                </div>
              );
            })}
          </div>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-4 text-center">
            Total últimos 7 días: <span className="font-semibold">{ultimos7Dias?.total || 0}</span> documentos
          </p>
        </div>

        {/* Tables */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* By Service */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Por servicio destino</h2>
            {porServicio.length > 0 ? (
              <div className="space-y-2">
                {porServicio.slice(0, 10).map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300">{item.servicio}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No hay datos todavía</p>
            )}
          </div>

          {/* By Type */}
          <div className="bg-white dark:bg-gray-800 rounded-xl p-6 border border-gray-200 dark:border-gray-700 shadow-sm">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Por tipo de documento</h2>
            {porTipo.length > 0 ? (
              <div className="space-y-2">
                {porTipo.map((item, index) => (
                  <div key={index} className="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700 last:border-0">
                    <span className="text-sm text-gray-700 dark:text-gray-300 capitalize">{item.tipo.replace(/-/g, ' ')}</span>
                    <span className="text-sm font-medium text-gray-900 dark:text-gray-100">{item.total}</span>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-gray-500 dark:text-gray-400 text-center py-4">No hay datos todavía</p>
            )}
          </div>
        </div>

        {/* Time Saved Explanation */}
        <div className="mt-8 bg-green-50 dark:bg-green-900/20 rounded-xl p-6 border border-green-200 dark:border-green-800">
          <div className="flex items-start gap-3">
            <div className="p-2 bg-green-100 dark:bg-green-900/50 rounded-lg shrink-0">
              <svg className="h-5 w-5 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-green-800 dark:text-green-200">Sobre el tiempo ahorrado</h3>
              <p className="text-sm text-green-700 dark:text-green-300 mt-1">
                Esta estimación se calcula asumiendo que escribir manualmente un documento de interconsulta
                tarda aproximadamente 10-12 minutos. La herramienta reduce ese tiempo en un ~70%.
                <strong className="block mt-2">Es una estimación orientativa, no un dato exacto.</strong>
              </p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>Los datos de analítica se guardan localmente en tu navegador.</p>
          <p className="mt-1">No se comparte ninguna información con servidores externos.</p>
        </footer>
      </div>
    </div>
  );
}
