'use client';

/**
 * Página de Configuración
 *
 * Permite al usuario:
 * - Configurar branding del centro/clínica
 * - Gestionar frases rápidas
 * - Editar checklists de revisión
 * - Editar la lista de servicios destino
 * - Editar la plantilla de interconsulta
 * - Configurar webhooks para integración con n8n/Zapier
 * - Restaurar configuración por defecto
 */

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { getPlaceholdersDisponibles, validarPlantilla } from '@/lib/templateEngine';
import { ServicioDestino, PlantillaConfig, TipoDocumento } from '@/types';
import { getConfiguracion, saveConfiguracion } from '@/lib/storage';
import { getBranding, saveBranding, resetBranding, PRESET_COLORS, BrandingConfig } from '@/lib/branding';
import { getFrasesRapidas, addFraseRapida, deleteFraseRapida, FraseRapida, SeccionFrase, SECCION_LABELS } from '@/lib/frasesRapidas';
import { getChecklists, saveChecklists, ChecklistItem } from '@/data/checklists';

// Tipos de documento disponibles (para futuras extensiones)
const TIPOS_DOCUMENTO: { value: TipoDocumento; label: string }[] = [
  { value: 'interconsulta', label: 'Interconsulta' },
];

// Secciones disponibles para frases rápidas (must match SeccionFrase type)
const SECCIONES_FRASES: { value: SeccionFrase; label: string }[] = [
  { value: 'motivo', label: 'Motivo de consulta' },
  { value: 'antecedentes', label: 'Antecedentes' },
  { value: 'exploracion', label: 'Exploración física' },
  { value: 'presuncion', label: 'Presunción diagnóstica' },
  { value: 'tratamiento', label: 'Tratamiento' },
];

export default function ConfiguracionPage() {
  // Estado de branding
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [brandingModified, setBrandingModified] = useState(false);

  // Estado de frases rápidas
  const [frases, setFrases] = useState<FraseRapida[]>([]);
  const [nuevaFrase, setNuevaFrase] = useState<{ seccion: SeccionFrase; etiqueta: string; texto: string }>({ seccion: 'motivo', etiqueta: '', texto: '' });
  const [showAddFrase, setShowAddFrase] = useState(false);

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
  const [activeSection, setActiveSection] = useState<'branding' | 'frases' | 'servicios' | 'plantilla' | 'webhooks' | 'ia'>('branding');

  // Mostrar mensaje temporal
  const mostrarMensaje = useCallback((tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 4000);
  }, []);

  // Cargar branding
  useEffect(() => {
    setBranding(getBranding());
    setFrases(getFrasesRapidas());
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
      const config = getConfiguracion();
      setWebhookEnabled(config.webhookEnabled || false);
      setWebhookUrl(config.webhookUrl || '');

      const response = await fetch('/api/hooks/interconsulta-creada');
      const data = await response.json();
      setWebhookStatus(data.configured ? 'configured' : 'not_configured');
    } catch {
      setWebhookStatus('not_configured');
    }
  }, []);

  // Cargar datos al montar
  useEffect(() => {
    cargarServicios();
    cargarPlantilla(tipoDocumentoSeleccionado);
    cargarWebhookConfig();
  }, [cargarServicios, cargarPlantilla, tipoDocumentoSeleccionado, cargarWebhookConfig]);

  // === Handlers de Branding ===
  const handleBrandingChange = (field: keyof BrandingConfig, value: string | boolean) => {
    if (branding) {
      setBranding({ ...branding, [field]: value });
      setBrandingModified(true);
    }
  };

  const handleSaveBranding = () => {
    if (branding) {
      saveBranding(branding);
      setBrandingModified(false);
      mostrarMensaje('success', 'Branding guardado correctamente');
    }
  };

  const handleResetBranding = () => {
    if (confirm('¿Restaurar branding a valores por defecto?')) {
      resetBranding();
      setBranding(getBranding());
      setBrandingModified(false);
      mostrarMensaje('success', 'Branding restaurado');
    }
  };

  // === Handlers de Frases Rápidas ===
  const handleAddFrase = () => {
    if (!nuevaFrase.etiqueta.trim() || !nuevaFrase.texto.trim()) {
      mostrarMensaje('error', 'Complete todos los campos de la frase');
      return;
    }

    addFraseRapida(nuevaFrase.seccion, nuevaFrase.etiqueta.trim(), nuevaFrase.texto.trim());
    setFrases(getFrasesRapidas());
    setNuevaFrase({ seccion: 'motivo', etiqueta: '', texto: '' });
    setShowAddFrase(false);
    mostrarMensaje('success', 'Frase añadida correctamente');
  };

  const handleDeleteFrase = (id: string) => {
    if (confirm('¿Eliminar esta frase rápida?')) {
      deleteFraseRapida(id);
      setFrases(getFrasesRapidas());
      mostrarMensaje('success', 'Frase eliminada');
    }
  };

  // === Handlers de Servicios ===
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

  // === Handlers de Plantilla ===
  const handleSavePlantilla = async () => {
    if (!plantilla) return;

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

  // === Handlers de Webhooks ===
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

  // === Reset General ===
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

  // Agrupar frases por sección
  const frasesPorSeccion = SECCIONES_FRASES.map(s => ({
    ...s,
    frases: frases.filter(f => f.seccion === s.value),
  }));

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 dark:from-blue-800 dark:via-blue-900 dark:to-indigo-900 text-white">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center justify-between">
            <div>
              <Link href="/" className="text-sm text-blue-200 hover:text-white mb-2 inline-flex items-center gap-1">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
                Volver al generador
              </Link>
              <h1 className="text-2xl sm:text-3xl font-bold">Configuración</h1>
              <p className="text-blue-100 mt-1">Personaliza la herramienta para tu clínica</p>
            </div>
            <div className="p-3 bg-white/10 rounded-lg">
              <svg className="h-8 w-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 -mt-4">
        {/* Mensaje de estado */}
        {mensaje && (
          <div
            className={`mb-6 p-4 rounded-lg flex items-center gap-3 ${
              mensaje.tipo === 'success'
                ? 'bg-green-50 border border-green-200 text-green-700 dark:bg-green-900/30 dark:border-green-800 dark:text-green-300'
                : 'bg-red-50 border border-red-200 text-red-700 dark:bg-red-900/30 dark:border-red-800 dark:text-red-300'
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

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar de navegación */}
          <div className="lg:col-span-1">
            <nav className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-2 sticky top-4">
              <button
                onClick={() => setActiveSection('branding')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === 'branding'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Branding / Centro
              </button>
              <button
                onClick={() => setActiveSection('frases')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === 'frases'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Frases Rápidas
              </button>
              <button
                onClick={() => setActiveSection('servicios')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === 'servicios'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Servicios Destino
              </button>
              <button
                onClick={() => setActiveSection('plantilla')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === 'plantilla'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Plantillas
              </button>
              <button
                onClick={() => setActiveSection('webhooks')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === 'webhooks'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Webhooks / n8n
              </button>
              <button
                onClick={() => setActiveSection('ia')}
                className={`w-full text-left px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                  activeSection === 'ia'
                    ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300'
                    : 'text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700'
                }`}
              >
                Integración IA
              </button>
            </nav>
          </div>

          {/* Contenido principal */}
          <div className="lg:col-span-3 space-y-6">
            {/* === Sección: Branding === */}
            {activeSection === 'branding' && branding && (
              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Branding del Centro
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Personaliza la herramienta con el nombre y colores de tu clínica u hospital.
                </p>

                <div className="space-y-4">
                  {/* Nombre del centro */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Nombre del centro
                    </label>
                    <input
                      type="text"
                      value={branding.nombreCentro}
                      onChange={(e) => handleBrandingChange('nombreCentro', e.target.value)}
                      placeholder="Hospital General..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Subtítulo */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subtítulo (opcional)
                    </label>
                    <input
                      type="text"
                      value={branding.subtitulo || ''}
                      onChange={(e) => handleBrandingChange('subtitulo', e.target.value)}
                      placeholder="Servicio de Medicina Interna..."
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                    />
                  </div>

                  {/* Color principal */}
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                      Color principal
                    </label>
                    <div className="flex flex-wrap gap-2 mb-2">
                      {PRESET_COLORS.map((color) => (
                        <button
                          key={color.value}
                          onClick={() => handleBrandingChange('colorPrincipal', color.value)}
                          className={`w-8 h-8 rounded-lg border-2 transition-all ${
                            branding.colorPrincipal === color.value
                              ? 'border-gray-900 dark:border-white scale-110'
                              : 'border-transparent'
                          }`}
                          style={{ backgroundColor: color.value }}
                          title={color.name}
                        />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={branding.colorPrincipal}
                        onChange={(e) => handleBrandingChange('colorPrincipal', e.target.value)}
                        className="w-10 h-10 rounded cursor-pointer"
                      />
                      <input
                        type="text"
                        value={branding.colorPrincipal}
                        onChange={(e) => handleBrandingChange('colorPrincipal', e.target.value)}
                        className="w-28 px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                      />
                    </div>
                  </div>

                  {/* Opciones de visualización */}
                  <div className="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={branding.mostrarEnHeader}
                        onChange={(e) => handleBrandingChange('mostrarEnHeader', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Mostrar nombre en el encabezado
                      </span>
                    </label>
                    <label className="flex items-center gap-3">
                      <input
                        type="checkbox"
                        checked={branding.mostrarEnDocumentos}
                        onChange={(e) => handleBrandingChange('mostrarEnDocumentos', e.target.checked)}
                        className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                      />
                      <span className="text-sm text-gray-700 dark:text-gray-300">
                        Incluir en documentos generados
                      </span>
                    </label>
                  </div>

                  {/* Botones */}
                  <div className="flex gap-3 pt-4">
                    <button
                      onClick={handleSaveBranding}
                      disabled={!brandingModified}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      Guardar cambios
                    </button>
                    <button
                      onClick={handleResetBranding}
                      className="px-4 py-2 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
                    >
                      Restaurar
                    </button>
                  </div>
                </div>
              </section>
            )}

            {/* === Sección: Frases Rápidas === */}
            {activeSection === 'frases' && (
              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Frases Rápidas
                  </h2>
                  <button
                    onClick={() => setShowAddFrase(!showAddFrase)}
                    className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                  >
                    + Añadir frase
                  </button>
                </div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  Crea frases predefinidas para insertar rápidamente en los formularios.
                </p>

                {/* Formulario para añadir frase */}
                {showAddFrase && (
                  <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg">
                    <h3 className="font-medium text-gray-900 dark:text-gray-100 mb-3">Nueva frase rápida</h3>
                    <div className="space-y-3">
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Sección
                          </label>
                          <select
                            value={nuevaFrase.seccion}
                            onChange={(e) => setNuevaFrase({ ...nuevaFrase, seccion: e.target.value as SeccionFrase })}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          >
                            {SECCIONES_FRASES.map((s) => (
                              <option key={s.value} value={s.value}>{s.label}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Etiqueta (botón)
                          </label>
                          <input
                            type="text"
                            value={nuevaFrase.etiqueta}
                            onChange={(e) => setNuevaFrase({ ...nuevaFrase, etiqueta: e.target.value })}
                            placeholder="Ej: HTA controlada"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                          Texto a insertar
                        </label>
                        <textarea
                          value={nuevaFrase.texto}
                          onChange={(e) => setNuevaFrase({ ...nuevaFrase, texto: e.target.value })}
                          rows={3}
                          placeholder="Texto completo que se insertará..."
                          className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100"
                        />
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={handleAddFrase}
                          className="px-3 py-1.5 text-sm bg-green-600 text-white rounded-lg hover:bg-green-700"
                        >
                          Guardar frase
                        </button>
                        <button
                          onClick={() => setShowAddFrase(false)}
                          className="px-3 py-1.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200"
                        >
                          Cancelar
                        </button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Lista de frases por sección */}
                <div className="space-y-4">
                  {frasesPorSeccion.map((seccion) => (
                    <div key={seccion.value}>
                      <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        {seccion.label} ({seccion.frases.length})
                      </h4>
                      {seccion.frases.length > 0 ? (
                        <div className="space-y-2">
                          {seccion.frases.map((frase) => (
                            <div
                              key={frase.id}
                              className="flex items-start justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                            >
                              <div className="flex-1 min-w-0">
                                <span className="inline-block px-2 py-0.5 text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/50 dark:text-blue-300 rounded mb-1">
                                  {frase.etiqueta}
                                </span>
                                <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                                  {frase.texto}
                                </p>
                                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                  Usado {frase.usos} veces
                                </p>
                              </div>
                              <button
                                onClick={() => handleDeleteFrase(frase.id)}
                                className="ml-2 p-1 text-red-500 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300"
                                title="Eliminar"
                              >
                                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-sm text-gray-400 dark:text-gray-500 italic">
                          No hay frases para esta sección
                        </p>
                      )}
                    </div>
                  ))}
                </div>

                {frases.length === 0 && (
                  <div className="text-center py-8">
                    <p className="text-gray-500 dark:text-gray-400">
                      No hay frases rápidas configuradas.
                    </p>
                    <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                      Añade frases para agilizar la redacción de documentos.
                    </p>
                  </div>
                )}
              </section>
            )}

            {/* === Sección: Servicios === */}
            {activeSection === 'servicios' && (
              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Servicios Destino
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Gestione la lista de servicios disponibles para las interconsultas.
                </p>

                {cargandoServicios ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando servicios...</span>
                  </div>
                ) : (
                  <>
                    <div className="mb-4">
                      <h3 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                        Servicios activos ({serviciosActivos.length})
                      </h3>
                      <div className="max-h-64 overflow-y-auto space-y-2">
                        {serviciosActivos.map(servicio => (
                          <div
                            key={servicio.id}
                            className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                          >
                            <span className="text-gray-700 dark:text-gray-300">{servicio.nombre}</span>
                            <button
                              onClick={() => handleRemoveServicio(servicio.id)}
                              disabled={guardando}
                              className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 text-sm disabled:opacity-50"
                            >
                              Eliminar
                            </button>
                          </div>
                        ))}
                        {serviciosActivos.length === 0 && (
                          <p className="text-gray-500 dark:text-gray-400 text-sm py-4 text-center">
                            No hay servicios activos
                          </p>
                        )}
                      </div>
                    </div>

                    {serviciosInactivos.length > 0 && (
                      <details className="mb-4">
                        <summary className="cursor-pointer text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200">
                          Servicios eliminados ({serviciosInactivos.length}) - Click para ver
                        </summary>
                        <div className="mt-2 max-h-32 overflow-y-auto space-y-2">
                          {serviciosInactivos.map(servicio => (
                            <div
                              key={servicio.id}
                              className="flex items-center justify-between p-3 bg-gray-100 dark:bg-gray-700 rounded-lg opacity-60"
                            >
                              <span className="text-gray-500 dark:text-gray-400 line-through">{servicio.nombre}</span>
                              <button
                                onClick={() => handleReactivarServicio(servicio.id)}
                                disabled={guardando}
                                className="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 text-sm disabled:opacity-50"
                              >
                                Reactivar
                              </button>
                            </div>
                          ))}
                        </div>
                      </details>
                    )}

                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={nuevoServicio}
                        onChange={e => setNuevoServicio(e.target.value)}
                        placeholder="Nombre del nuevo servicio..."
                        className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
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
            )}

            {/* === Sección: Plantilla === */}
            {activeSection === 'plantilla' && (
              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                    Plantilla de Documento
                  </h2>
                  <select
                    value={tipoDocumentoSeleccionado}
                    disabled
                    className="px-3 py-1 border border-gray-300 dark:border-gray-600 rounded-lg text-sm bg-gray-50 dark:bg-gray-700"
                  >
                    {TIPOS_DOCUMENTO.map(t => (
                      <option key={t.value} value={t.value}>{t.label}</option>
                    ))}
                  </select>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Edite la plantilla de texto para las interconsultas. Use los placeholders para insertar datos.
                </p>

                {cargandoPlantilla ? (
                  <div className="flex items-center justify-center py-8">
                    <svg className="animate-spin h-6 w-6 text-blue-600" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                    </svg>
                    <span className="ml-2 text-gray-600 dark:text-gray-400">Cargando plantilla...</span>
                  </div>
                ) : (
                  <>
                    {erroresPlantilla.length > 0 && (
                      <div className="mb-4 p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
                        <p className="text-red-700 dark:text-red-300 font-medium">Errores en la plantilla:</p>
                        <ul className="mt-2 list-disc list-inside text-red-600 dark:text-red-400 text-sm">
                          {erroresPlantilla.map((error, index) => (
                            <li key={index}>{error}</li>
                          ))}
                        </ul>
                      </div>
                    )}

                    <textarea
                      value={plantillaEditada}
                      onChange={e => setPlantillaEditada(e.target.value)}
                      rows={20}
                      disabled={guardando}
                      className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg font-mono text-sm bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
                    />

                    <details className="mt-4">
                      <summary className="cursor-pointer text-sm font-medium text-gray-700 dark:text-gray-300 hover:text-gray-900 dark:hover:text-gray-100">
                        Ver placeholders disponibles
                      </summary>
                      <div className="mt-2 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg max-h-64 overflow-y-auto">
                        <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
                          Use <code className="bg-gray-200 dark:bg-gray-600 px-1 rounded">{'{{campo}}'}</code> para insertar datos.
                        </p>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                          {placeholders.map(p => (
                            <div key={p.campo} className="text-sm">
                              <code className="bg-blue-100 dark:bg-blue-900/50 text-blue-800 dark:text-blue-300 px-1 rounded">
                                {`{{${p.campo}}}`}
                              </code>
                              <span className="ml-2 text-gray-600 dark:text-gray-400">{p.descripcion}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </details>

                    <div className="mt-4 flex gap-3">
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
                      <button
                        onClick={handleReset}
                        disabled={guardando}
                        className="px-4 py-2 text-red-600 dark:text-red-400 border border-red-300 dark:border-red-700 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/30 disabled:opacity-50"
                      >
                        Restaurar todo
                      </button>
                    </div>
                  </>
                )}
              </section>
            )}

            {/* === Sección: Webhooks === */}
            {activeSection === 'webhooks' && (
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
                    {webhookStatus === 'configured' ? 'Servidor configurado' : 'No configurado'}
                  </span>
                </div>

                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  Envía automáticamente los documentos generados a sistemas externos como n8n, Zapier o Make.
                </p>

                <div className="space-y-4">
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
                        className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 focus:ring-2 focus:ring-blue-500"
                      />
                      <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
                        La URL principal se configura en el servidor con WEBHOOK_URL en .env.local
                      </p>
                    </div>
                  )}

                  <button
                    onClick={handleSaveWebhook}
                    disabled={guardando}
                    className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50"
                  >
                    Guardar configuración
                  </button>
                </div>

                <div className="mt-4 p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
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
            )}

            {/* === Sección: IA === */}
            {activeSection === 'ia' && (
              <section className="bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 p-6">
                <h2 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
                  Integración con IA
                </h2>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
                  La mejora de redacción con IA requiere configurar la variable de
                  entorno <code className="bg-gray-100 dark:bg-gray-700 px-1 rounded">OPENAI_API_KEY</code>.
                </p>
                <div className="p-4 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg text-sm text-blue-800 dark:text-blue-300">
                  <p className="font-medium">Para activar la IA:</p>
                  <ol className="mt-2 list-decimal list-inside space-y-1">
                    <li>Cree un archivo <code>.env.local</code> en la raíz del proyecto</li>
                    <li>Añada: <code>OPENAI_API_KEY=su_clave_aqui</code></li>
                    <li>Reinicie el servidor de desarrollo</li>
                  </ol>
                </div>
                <div className="mt-4 p-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg text-sm text-amber-800 dark:text-amber-300">
                  <p className="font-medium">Importante sobre privacidad:</p>
                  <p className="mt-1">
                    La IA solo mejora la redacción del texto. No añade información clínica
                    ni toma decisiones médicas. En entornos de producción, asegúrese de
                    cumplir con la normativa de protección de datos sanitarios.
                  </p>
                </div>
              </section>
            )}
          </div>
        </div>

        {/* Footer */}
        <footer className="mt-8 text-center text-sm text-gray-500 dark:text-gray-400">
          <p>La configuración se guarda localmente en tu navegador.</p>
        </footer>
      </div>
    </div>
  );
}
