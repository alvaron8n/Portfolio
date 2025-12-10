'use client';

/**
 * Página de Configuración
 *
 * Permite al usuario:
 * - Editar la lista de servicios destino
 * - Editar la plantilla de interconsulta
 * - Configurar webhooks para integración con n8n/Zapier
 * - Restaurar configuración por defecto
 *
 * Toda la persistencia se realiza a través de las APIs:
 * - /api/servicios
 * - /api/plantillas
 * - /api/hooks/interconsulta-creada (webhook)
 */

import { useState, useEffect, useCallback } from 'react';
import { getPlaceholdersDisponibles, validarPlantilla } from '@/lib/templateEngine';
import { ServicioDestino, PlantillaConfig, TipoDocumento } from '@/types';
import { getConfiguracion, saveConfiguracion } from '@/lib/storage';

// Tipos de documento disponibles (para futuras extensiones)
const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'interconsulta', label: 'Interconsulta' },
  // Deshabilitados por ahora, pero preparados para el futuro
  // { value: 'informe_alta', label: 'Informe de Alta' },
  // { value: 'peticion_pruebas', label: 'Petición de Pruebas' },
];

export default function ConfiguracionPage() {
  // Estado de servicios
  const [servicios, setServicios] = useState<ServicioDestino[]>([]);
  const [nuevoServicio, setNuevoServicio] = useState('');
  const [cargandoServicios, setCargandoServicios] = useState(true);

  // Estado de plantilla
  const [tipoDocumentoSeleccionado] = useState<TipoDocumento>('interconsulta');
  const [plantilla, setPlantilla] = useState<PlantillaConfig | null>(null);
  const [plantillaEditada, setPlantillaEditada] = useState('');
  const [cargandoPlantilla, setCargandoPlantilla] = useState(true);
  const [erroresPlantilla, setErroresPlantilla] = useState<string[]>([]);

  // Estado de webhooks
  const [webhookEnabled, setWebhookEnabled] = useState(false);
  const [webhookUrl, setWebhookUrl] = useState('');
  const [webhookStatus, setWebhookStatus] = useState<'unknown' | 'configured' | 'not_configured'>('unknown');

  // Estado global
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);

  // Mostrar mensaje temporal
  const mostrarMensaje = useCallback((tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  }, []);

  // Cargar servicios desde API
  const cargarServicios = useCallback(async () => {
    setCargandoServicios(true);
    try {
      const response = await fetch('/api/servicios?all=true');
      if (!response.ok) throw new Error('Error al cargar servicios');

      const data = await response.json();
      setServicios(data.servicios || []);
    } catch (error) {
      console.error('Error cargando servicios:', error);
      mostrarMensaje('error', 'Error al cargar los servicios');
    } finally {
      setCargandoServicios(false);
    }
  }, [mostrarMensaje]);

  // Cargar plantilla desde API
  const cargarPlantilla = useCallback(async (tipo: TipoDocumento) => {
    setCargandoPlantilla(true);
    try {
      const response = await fetch(`/api/plantillas?tipo=${tipo}`);

      if (response.status === 404) {
        // No hay plantilla para este tipo, usar valores vacíos
        setPlantilla(null);
        setPlantillaEditada('');
        return;
      }

      if (!response.ok) throw new Error('Error al cargar plantilla');

      const data = await response.json();
      setPlantilla(data.plantilla);
      setPlantillaEditada(data.plantilla?.contenido || '');
    } catch (error) {
      console.error('Error cargando plantilla:', error);
      mostrarMensaje('error', 'Error al cargar la plantilla');
    } finally {
      setCargandoPlantilla(false);
    }
  }, [mostrarMensaje]);

  // Cargar configuración de webhooks
  const cargarWebhookConfig = useCallback(async () => {
    try {
      // Cargar configuración local
      const config = getConfiguracion();
      setWebhookEnabled(config.webhookEnabled || false);
      setWebhookUrl(config.webhookUrl || '');

      // Verificar estado del servidor
      const response = await fetch('/api/hooks/interconsulta-creada');
      const data = await response.json();
      setWebhookStatus(data.configured ? 'configured' : 'not_configured');
    } catch {
      setWebhookStatus('not_configured');
    }
  }, []);

  // Guardar configuración de webhooks
  const handleSaveWebhook = () => {
    try {
      const config = getConfiguracion();
      config.webhookEnabled = webhookEnabled;
      config.webhookUrl = webhookUrl;
      saveConfiguracion(config);
      mostrarMensaje('success', 'Configuración de webhook guardada');
    } catch (error) {
      console.error('Error guardando webhook:', error);
      mostrarMensaje('error', 'Error al guardar la configuración de webhook');
    }
  };

  // Cargar datos al montar
  useEffect(() => {
    cargarServicios();
    cargarPlantilla(tipoDocumentoSeleccionado);
    cargarWebhookConfig();
  }, [cargarServicios, cargarPlantilla, tipoDocumentoSeleccionado, cargarWebhookConfig]);

  // Añadir nuevo servicio
  const handleAddServicio = async () => {
    if (!nuevoServicio.trim()) return;

    setGuardando(true);
    try {
      const response = await fetch('/api/servicios', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre: nuevoServicio.trim() }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al crear servicio');
      }

      setServicios(prev => [...prev, data.servicio]);
      setNuevoServicio('');
      mostrarMensaje('success', 'Servicio añadido correctamente');
    } catch (error) {
      console.error('Error añadiendo servicio:', error);
      mostrarMensaje('error', error instanceof Error ? error.message : 'Error al añadir servicio');
    } finally {
      setGuardando(false);
    }
  };

  // Eliminar servicio
  const handleRemoveServicio = async (id: string) => {
    setGuardando(true);
    try {
      const response = await fetch(`/api/servicios?id=${id}`, {
        method: 'DELETE',
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al eliminar servicio');
      }

      // Marcar como inactivo en el estado local
      setServicios(prev =>
        prev.map(s => (s.id === id ? { ...s, activo: false } : s))
      );
      mostrarMensaje('success', 'Servicio eliminado');
    } catch (error) {
      console.error('Error eliminando servicio:', error);
      mostrarMensaje('error', error instanceof Error ? error.message : 'Error al eliminar servicio');
    } finally {
      setGuardando(false);
    }
  };

  // Reactivar servicio
  const handleReactivarServicio = async (id: string) => {
    setGuardando(true);
    try {
      const response = await fetch('/api/servicios', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ id, activo: true }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || 'Error al reactivar servicio');
      }

      setServicios(prev =>
        prev.map(s => (s.id === id ? { ...s, activo: true } : s))
      );
      mostrarMensaje('success', 'Servicio reactivado');
    } catch (error) {
      console.error('Error reactivando servicio:', error);
      mostrarMensaje('error', error instanceof Error ? error.message : 'Error al reactivar servicio');
    } finally {
      setGuardando(false);
    }
  };

  // Guardar plantilla
  const handleSavePlantilla = async () => {
    if (!plantilla) return;

    // Validar plantilla
    const validacion = validarPlantilla(plantillaEditada);
    if (!validacion.valido) {
      setErroresPlantilla(validacion.errores);
      mostrarMensaje('error', 'La plantilla tiene errores. Revíselos antes de guardar.');
      return;
    }

    setGuardando(true);
    setErroresPlantilla([]);

    try {
      const response = await fetch('/api/plantillas', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...plantilla,
          contenido: plantillaEditada,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Error al guardar plantilla');
      }

      setPlantilla(data.plantilla);
      mostrarMensaje('success', 'Plantilla guardada correctamente');
    } catch (error) {
      console.error('Error guardando plantilla:', error);
      mostrarMensaje('error', error instanceof Error ? error.message : 'Error al guardar plantilla');
    } finally {
      setGuardando(false);
    }
  };

  // Restaurar configuración por defecto
  const handleReset = async () => {
    if (!confirm('¿Está seguro de que desea restaurar la configuración por defecto? Se perderán todos los cambios.')) {
      return;
    }

    setGuardando(true);
    try {
      const response = await fetch('/api/plantillas', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      });

      if (!response.ok) {
        throw new Error('Error al restaurar configuración');
      }

      // Recargar datos
      await cargarServicios();
      await cargarPlantilla(tipoDocumentoSeleccionado);
      mostrarMensaje('success', 'Configuración restaurada a valores por defecto');
    } catch (error) {
      console.error('Error restaurando configuración:', error);
      mostrarMensaje('error', 'Error al restaurar la configuración');
    } finally {
      setGuardando(false);
    }
  };

  const placeholders = getPlaceholdersDisponibles();
  const serviciosActivos = servicios.filter(s => s.activo);
  const serviciosInactivos = servicios.filter(s => !s.activo);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configuración</h1>

      {/* Mensaje de estado */}
      {mensaje && (
        <div
          className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
            mensaje.tipo === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
          {mensaje.tipo === 'success' ? (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          )}
          {mensaje.texto}
        </div>
      )}

      <div className="space-y-8">
        {/* Sección: Servicios destino */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Servicios Destino
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Gestione la lista de servicios disponibles para las interconsultas.
            Los cambios se guardan automáticamente en el servidor.
          </p>

          {cargandoServicios ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="ml-2 text-gray-600">Cargando servicios...</span>
            </div>
          ) : (
            <>
              {/* Lista de servicios activos */}
              <div className="mb-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">
                  Servicios activos ({serviciosActivos.length})
                </h3>
                <div className="max-h-64 overflow-y-auto space-y-2">
                  {serviciosActivos.map(servicio => (
                    <div
                      key={servicio.id}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                    >
                      <span className="text-gray-700">{servicio.nombre}</span>
                      <button
                        onClick={() => handleRemoveServicio(servicio.id)}
                        disabled={guardando}
                        className="text-red-600 hover:text-red-800 text-sm disabled:opacity-50"
                      >
                        Eliminar
                      </button>
                    </div>
                  ))}
                  {serviciosActivos.length === 0 && (
                    <p className="text-gray-500 text-sm py-4 text-center">
                      No hay servicios activos
                    </p>
                  )}
                </div>
              </div>

              {/* Servicios inactivos (colapsable) */}
              {serviciosInactivos.length > 0 && (
                <details className="mb-4">
                  <summary className="cursor-pointer text-sm text-gray-600 hover:text-gray-900">
                    Servicios eliminados ({serviciosInactivos.length}) - Click para ver
                  </summary>
                  <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                    {serviciosInactivos.map(servicio => (
                      <div
                        key={servicio.id}
                        className="flex items-center justify-between p-3 bg-gray-100 rounded-lg opacity-60"
                      >
                        <span className="text-gray-500 line-through">{servicio.nombre}</span>
                        <button
                          onClick={() => handleReactivarServicio(servicio.id)}
                          disabled={guardando}
                          className="text-blue-600 hover:text-blue-800 text-sm disabled:opacity-50"
                        >
                          Reactivar
                        </button>
                      </div>
                    ))}
                  </div>
                </details>
              )}

              {/* Añadir nuevo servicio */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={nuevoServicio}
                  onChange={e => setNuevoServicio(e.target.value)}
                  placeholder="Nombre del nuevo servicio..."
                  className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  onKeyDown={e => e.key === 'Enter' && handleAddServicio()}
                  disabled={guardando}
                />
                <button
                  onClick={handleAddServicio}
                  disabled={!nuevoServicio.trim() || guardando}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Añadir
                </button>
              </div>
            </>
          )}
        </section>

        {/* Sección: Plantilla */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">
              Plantilla de Documento
            </h2>

            {/* Selector de tipo de documento (preparado para futuro) */}
            <div className="flex items-center gap-2">
              <label className="text-sm text-gray-600">Tipo:</label>
              <select
                value={tipoDocumentoSeleccionado}
                disabled // Deshabilitado por ahora, solo hay interconsulta
                className="px-3 py-1 border border-gray-300 rounded-lg text-sm bg-gray-50"
              >
                {TIPOS_DOCUMENTO.map(t => (
                  <option key={t.value} value={t.value}>{t.label}</option>
                ))}
              </select>
            </div>
          </div>

          <p className="text-sm text-gray-600 mb-4">
            Edite la plantilla de texto para las interconsultas. Use los
            placeholders disponibles para insertar datos del formulario.
          </p>

          {cargandoPlantilla ? (
            <div className="flex items-center justify-center py-8">
              <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
              </svg>
              <span className="ml-2 text-gray-600">Cargando plantilla...</span>
            </div>
          ) : (
            <>
              {/* Errores de validación */}
              {erroresPlantilla.length > 0 && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <p className="text-red-700 font-medium">Errores en la plantilla:</p>
                  <ul className="mt-2 list-disc list-inside text-red-600 text-sm">
                    {erroresPlantilla.map((error, index) => (
                      <li key={index}>{error}</li>
                    ))}
                  </ul>
                </div>
              )}

              {/* Editor de plantilla */}
              <textarea
                value={plantillaEditada}
                onChange={e => setPlantillaEditada(e.target.value)}
                rows={20}
                disabled={guardando}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500 disabled:opacity-50"
              />

              {/* Placeholders disponibles */}
              <details className="mt-4">
                <summary className="cursor-pointer text-sm font-medium text-gray-700 hover:text-gray-900">
                  Ver placeholders disponibles
                </summary>
                <div className="mt-2 p-4 bg-gray-50 rounded-lg max-h-64 overflow-y-auto">
                  <p className="text-xs text-gray-500 mb-2">
                    Use <code className="bg-gray-200 px-1 rounded">{'{{campo}}'}</code> para insertar datos.
                    Use <code className="bg-gray-200 px-1 rounded">{'{{#campo}}...{{/campo}}'}</code> para secciones condicionales.
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                    {placeholders.map(p => (
                      <div key={p.campo} className="text-sm">
                        <code className="bg-blue-100 text-blue-800 px-1 rounded">
                          {`{{${p.campo}}}`}
                        </code>
                        <span className="ml-2 text-gray-600">{p.descripcion}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </details>

              <div className="mt-4 flex justify-end">
                <button
                  onClick={handleSavePlantilla}
                  disabled={guardando || !plantilla}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {guardando && (
                    <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                  )}
                  Guardar plantilla
                </button>
              </div>
            </>
          )}
        </section>

        {/* Sección: Restaurar */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Restaurar configuración
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Restaure todos los valores a la configuración por defecto. Esta
            acción eliminará todos los cambios realizados en servicios y plantillas.
          </p>
          <button
            onClick={handleReset}
            disabled={guardando}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50"
          >
            Restaurar valores por defecto
          </button>
        </section>

        {/* Sección: Webhooks */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
              Webhooks / n8n
            </h2>
            <span className={`px-2 py-1 text-xs rounded-full ${
              webhookStatus === 'configured'
                ? 'bg-green-100 text-green-700 dark:bg-green-900/50 dark:text-green-400'
                : 'bg-gray-100 text-gray-600 dark:bg-gray-700 dark:text-gray-400'
            }`}>
              {webhookStatus === 'configured' ? 'Servidor configurado' : 'No configurado en servidor'}
            </span>
          </div>

          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            Envía automáticamente los documentos generados a sistemas externos como n8n, Zapier o Make.
          </p>

          <div className="space-y-4">
            {/* Toggle de activación */}
            <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
              <div>
                <p className="font-medium text-gray-900 dark:text-gray-100">Activar webhooks</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  Enviar datos cuando se genera un documento
                </p>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={webhookEnabled}
                  onChange={e => setWebhookEnabled(e.target.checked)}
                  className="sr-only peer"
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-600 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-500 peer-checked:bg-blue-600"></div>
              </label>
            </div>

            {/* URL del webhook (solo visible si está activado) */}
            {webhookEnabled && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  URL del Webhook (opcional, solo para testing local)
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={e => setWebhookUrl(e.target.value)}
                  placeholder="https://your-n8n-instance.com/webhook/..."
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                  La URL principal se configura en el servidor con WEBHOOK_URL en .env.local
                </p>
              </div>
            )}

            <button
              onClick={handleSaveWebhook}
              disabled={guardando}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Guardar configuración
            </button>
          </div>

          {/* Información sobre configuración del servidor */}
          <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
            <p className="font-medium">Configuración del servidor:</p>
            <p className="mt-1">
              Para que los webhooks funcionen, configure las variables en <code className="bg-blue-100 dark:bg-blue-800 px-1 rounded">.env.local</code>:
            </p>
            <pre className="mt-2 p-2 bg-blue-100 dark:bg-blue-800/50 rounded text-xs overflow-x-auto">
{`WEBHOOK_URL=https://your-n8n.com/webhook/xxx
WEBHOOK_SECRET=your-secret-key`}
            </pre>
          </div>
        </section>

        {/* Información sobre IA */}
        <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
          <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Integración con IA
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            La mejora de redacción con IA requiere configurar la variable de
            entorno <code className="bg-gray-100 px-1 rounded">OPENAI_API_KEY</code>.
          </p>
          <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg text-sm text-blue-800">
            <p className="font-medium">Para activar la IA:</p>
            <ol className="mt-2 list-decimal list-inside space-y-1">
              <li>Cree un archivo <code>.env.local</code> en la raíz del proyecto</li>
              <li>Añada: <code>OPENAI_API_KEY=su_clave_aqui</code></li>
              <li>Reinicie el servidor de desarrollo</li>
            </ol>
          </div>
          <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800">
            <p className="font-medium">Importante sobre privacidad:</p>
            <p className="mt-1">
              La IA solo mejora la redacción del texto. No añade información clínica
              ni toma decisiones médicas. En entornos de producción, asegúrese de
              cumplir con la normativa de protección de datos sanitarios.
            </p>
          </div>
        </section>
      </div>
    </div>
  );
}
