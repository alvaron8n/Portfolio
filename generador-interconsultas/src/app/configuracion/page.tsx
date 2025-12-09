'use client';

/**
 * Página de Configuración
 *
 * Permite al usuario:
 * - Editar la lista de servicios destino
 * - Editar la plantilla de interconsulta
 * - Restaurar configuración por defecto
 */

import { useState, useEffect } from 'react';
import {
  getConfiguracion,
  saveServiciosDestino,
  savePlantilla,
  resetConfiguracion,
  addServicioDestino,
  removeServicioDestino,
} from '@/lib/storage';
import { getPlaceholdersDisponibles, validarPlantilla } from '@/lib/templateEngine';
import { ServicioDestino, PlantillaConfig } from '@/types';

export default function ConfiguracionPage() {
  const [servicios, setServicios] = useState<ServicioDestino[]>([]);
  const [plantilla, setPlantilla] = useState<PlantillaConfig | null>(null);
  const [nuevoServicio, setNuevoServicio] = useState('');
  const [plantillaEditada, setPlantillaEditada] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [mensaje, setMensaje] = useState<{ tipo: 'success' | 'error'; texto: string } | null>(null);
  const [erroresPlantilla, setErroresPlantilla] = useState<string[]>([]);

  // Cargar configuración al montar
  useEffect(() => {
    cargarConfiguracion();
  }, []);

  const cargarConfiguracion = () => {
    const config = getConfiguracion();
    setServicios(config.serviciosDestino);
    const plantillaActiva = config.plantillas.find(p => p.tipo === 'interconsulta' && p.activa);
    if (plantillaActiva) {
      setPlantilla(plantillaActiva);
      setPlantillaEditada(plantillaActiva.contenido);
    }
  };

  // Mostrar mensaje temporal
  const mostrarMensaje = (tipo: 'success' | 'error', texto: string) => {
    setMensaje({ tipo, texto });
    setTimeout(() => setMensaje(null), 3000);
  };

  // Añadir nuevo servicio
  const handleAddServicio = () => {
    if (!nuevoServicio.trim()) return;

    const servicio = addServicioDestino(nuevoServicio.trim());
    setServicios(prev => [...prev, servicio]);
    setNuevoServicio('');
    mostrarMensaje('success', 'Servicio añadido correctamente');
  };

  // Eliminar servicio
  const handleRemoveServicio = (id: string) => {
    removeServicioDestino(id);
    setServicios(prev => prev.filter(s => s.id !== id));
    mostrarMensaje('success', 'Servicio eliminado');
  };

  // Guardar servicios
  const handleSaveServicios = () => {
    setGuardando(true);
    try {
      saveServiciosDestino(servicios);
      mostrarMensaje('success', 'Servicios guardados correctamente');
    } catch {
      mostrarMensaje('error', 'Error al guardar los servicios');
    } finally {
      setGuardando(false);
    }
  };

  // Validar y guardar plantilla
  const handleSavePlantilla = () => {
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
      const plantillaActualizada: PlantillaConfig = {
        ...plantilla,
        contenido: plantillaEditada,
        fechaModificacion: new Date().toISOString(),
      };
      savePlantilla(plantillaActualizada);
      setPlantilla(plantillaActualizada);
      mostrarMensaje('success', 'Plantilla guardada correctamente');
    } catch {
      mostrarMensaje('error', 'Error al guardar la plantilla');
    } finally {
      setGuardando(false);
    }
  };

  // Restaurar configuración por defecto
  const handleReset = () => {
    if (!confirm('¿Está seguro de que desea restaurar la configuración por defecto? Se perderán todos los cambios.')) {
      return;
    }

    resetConfiguracion();
    cargarConfiguracion();
    mostrarMensaje('success', 'Configuración restaurada a valores por defecto');
  };

  const placeholders = getPlaceholdersDisponibles();

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <h1 className="text-2xl font-bold text-gray-900 mb-8">Configuración</h1>

      {/* Mensaje de estado */}
      {mensaje && (
        <div
          className={`mb-6 p-4 rounded-lg ${
            mensaje.tipo === 'success'
              ? 'bg-green-50 border border-green-200 text-green-700'
              : 'bg-red-50 border border-red-200 text-red-700'
          }`}
        >
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
          </p>

          {/* Lista de servicios */}
          <div className="mb-4 max-h-64 overflow-y-auto">
            <div className="space-y-2">
              {servicios.filter(s => s.activo).map(servicio => (
                <div
                  key={servicio.id}
                  className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
                >
                  <span className="text-gray-700">{servicio.nombre}</span>
                  <button
                    onClick={() => handleRemoveServicio(servicio.id)}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              ))}
            </div>
          </div>

          {/* Añadir nuevo servicio */}
          <div className="flex gap-2">
            <input
              type="text"
              value={nuevoServicio}
              onChange={e => setNuevoServicio(e.target.value)}
              placeholder="Nombre del nuevo servicio..."
              className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              onKeyDown={e => e.key === 'Enter' && handleAddServicio()}
            />
            <button
              onClick={handleAddServicio}
              disabled={!nuevoServicio.trim()}
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Añadir
            </button>
          </div>

          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveServicios}
              disabled={guardando}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Guardar servicios
            </button>
          </div>
        </section>

        {/* Sección: Plantilla */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Plantilla de Interconsulta
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Edite la plantilla de texto para las interconsultas. Use los
            placeholders disponibles para insertar datos del formulario.
          </p>

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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg font-mono text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
              disabled={guardando}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50"
            >
              Guardar plantilla
            </button>
          </div>
        </section>

        {/* Sección: Restaurar */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
            Restaurar configuración
          </h2>
          <p className="text-sm text-gray-600 mb-4">
            Restaure todos los valores a la configuración por defecto. Esta
            acción eliminará todos los cambios realizados.
          </p>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Restaurar valores por defecto
          </button>
        </section>

        {/* Información sobre IA */}
        <section className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">
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
        </section>
      </div>
    </div>
  );
}
