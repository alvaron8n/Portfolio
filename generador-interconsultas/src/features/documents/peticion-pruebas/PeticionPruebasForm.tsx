'use client';

/**
 * Formulario de Petición de Pruebas Diagnósticas
 *
 * Formulario completo para solicitar pruebas de laboratorio, imagen u otras.
 * Incluye sugerencias de pruebas comunes y validación con Zod.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  peticionPruebasSchema,
  PeticionPruebasFormData,
  peticionPruebasInitialValues,
  TIPOS_PRUEBAS_LABORATORIO,
  TIPOS_PRUEBAS_IMAGEN,
  TIPOS_PRUEBAS_FUNCIONALES,
} from './schema';

interface PeticionPruebasFormProps {
  onGenerate: (data: PeticionPruebasFormData) => void;
  loading?: boolean;
}

export default function PeticionPruebasForm({
  onGenerate,
  loading = false,
}: PeticionPruebasFormProps) {
  const [formData, setFormData] = useState<PeticionPruebasFormData>(
    peticionPruebasInitialValues
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Obtener sugerencias según el tipo de prueba
  const getSugerencias = () => {
    switch (formData.pruebas.tipo) {
      case 'Laboratorio':
        return TIPOS_PRUEBAS_LABORATORIO;
      case 'Imagen':
        return TIPOS_PRUEBAS_IMAGEN;
      case 'Funcionales':
        return TIPOS_PRUEBAS_FUNCIONALES;
      default:
        return [];
    }
  };

  // Agregar prueba sugerida al listado
  const agregarPrueba = (prueba: string) => {
    const current = formData.pruebas.listaPruebas;
    const nuevaLista = current ? `${current}\n- ${prueba}` : `- ${prueba}`;
    updateNested('pruebas', 'listaPruebas', nuevaLista);
  };

  // Actualizar campo anidado
  const updateNested = (
    section: keyof PeticionPruebasFormData,
    field: string,
    value: string | number | boolean
  ) => {
    setFormData((prev) => ({
      ...prev,
      [section]: {
        ...(prev[section] as Record<string, unknown>),
        [field]: value,
      },
    }));
    // Limpiar error del campo
    setErrors((prev) => {
      const newErrors = { ...prev };
      delete newErrors[`${section}.${field}`];
      return newErrors;
    });
  };

  // Manejar envío del formulario
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (loading) return;

      // Validar con Zod
      const result = peticionPruebasSchema.safeParse(formData);

      if (!result.success) {
        const newErrors: Record<string, string> = {};
        result.error.issues.forEach((err) => {
          const path = err.path.join('.');
          newErrors[path] = err.message;
        });
        setErrors(newErrors);
        return;
      }

      setErrors({});
      onGenerate(result.data);
    },
    [formData, loading, onGenerate]
  );

  // Atajo de teclado Ctrl+Enter
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        handleSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [handleSubmit]);

  // Determinar si un campo tiene error
  const hasError = (path: string) => !!errors[path];
  const getError = (path: string) => errors[path];

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* ========== DATOS DEL PACIENTE ========== */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">👤</span>
          Datos del Paciente
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre/Iniciales *
            </label>
            <input
              type="text"
              value={formData.paciente.nombre}
              onChange={(e) => updateNested('paciente', 'nombre', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                hasError('paciente.nombre') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="J.G.M."
              data-has-error={hasError('paciente.nombre')}
            />
            {hasError('paciente.nombre') && (
              <p className="mt-1 text-sm text-red-600">{getError('paciente.nombre')}</p>
            )}
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Edad *
              </label>
              <input
                type="number"
                min="0"
                max="150"
                value={formData.paciente.edad || ''}
                onChange={(e) =>
                  updateNested('paciente', 'edad', parseInt(e.target.value) || 0)
                }
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                  hasError('paciente.edad') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="65"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexo *
              </label>
              <select
                value={formData.paciente.sexo}
                onChange={(e) => updateNested('paciente', 'sexo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              >
                <option value="No especificado">No especificado</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            NHC / Historia Clínica
          </label>
          <input
            type="text"
            value={formData.paciente.identificador || ''}
            onChange={(e) => updateNested('paciente', 'identificador', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="123456"
          />
        </div>
      </fieldset>

      {/* ========== INFORMACIÓN CLÍNICA ========== */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Información Clínica
        </legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnóstico Principal *
          </label>
          <input
            type="text"
            value={formData.clinico.diagnosticoPrincipal}
            onChange={(e) =>
              updateNested('clinico', 'diagnosticoPrincipal', e.target.value)
            }
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              hasError('clinico.diagnosticoPrincipal') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Sospecha de diabetes mellitus tipo 2"
            data-has-error={hasError('clinico.diagnosticoPrincipal')}
          />
          {hasError('clinico.diagnosticoPrincipal') && (
            <p className="mt-1 text-sm text-red-600">
              {getError('clinico.diagnosticoPrincipal')}
            </p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnósticos Secundarios
          </label>
          <input
            type="text"
            value={formData.clinico.diagnosticosSecundarios || ''}
            onChange={(e) =>
              updateNested('clinico', 'diagnosticosSecundarios', e.target.value)
            }
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="HTA, Dislipemia"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Situación Clínica Actual
          </label>
          <textarea
            value={formData.clinico.situacionClinica || ''}
            onChange={(e) => updateNested('clinico', 'situacionClinica', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Paciente estable, asintomático..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Información Relevante
          </label>
          <textarea
            value={formData.clinico.informacionRelevante || ''}
            onChange={(e) =>
              updateNested('clinico', 'informacionRelevante', e.target.value)
            }
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Alergias, contraindicaciones, medicación actual..."
          />
        </div>
      </fieldset>

      {/* ========== PRUEBAS SOLICITADAS ========== */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">🔬</span>
          Pruebas Solicitadas
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de Pruebas *
            </label>
            <select
              value={formData.pruebas.tipo}
              onChange={(e) => updateNested('pruebas', 'tipo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            >
              <option value="Laboratorio">Laboratorio</option>
              <option value="Imagen">Imagen</option>
              <option value="Funcionales">Funcionales</option>
              <option value="Otras">Otras</option>
            </select>
          </div>

          <div className="flex items-center gap-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={formData.pruebas.urgente}
                onChange={(e) => updateNested('pruebas', 'urgente', e.target.checked)}
                className="w-4 h-4 text-red-600 border-gray-300 rounded focus:ring-red-500"
              />
              <span className="text-sm font-medium text-gray-700">
                🚨 Urgente
              </span>
            </label>
          </div>
        </div>

        {/* Sugerencias de pruebas */}
        {getSugerencias().length > 0 && (
          <div className="bg-purple-50 rounded-lg p-4">
            <p className="text-sm font-medium text-purple-900 mb-2">
              Pruebas sugeridas (clic para agregar):
            </p>
            <div className="flex flex-wrap gap-2">
              {getSugerencias().map((prueba) => (
                <button
                  key={prueba}
                  type="button"
                  onClick={() => agregarPrueba(prueba)}
                  className="px-2 py-1 text-xs bg-white border border-purple-200 rounded-full hover:bg-purple-100 hover:border-purple-300 transition-colors"
                >
                  + {prueba}
                </button>
              ))}
            </div>
          </div>
        )}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Lista de Pruebas *
          </label>
          <textarea
            value={formData.pruebas.listaPruebas}
            onChange={(e) => updateNested('pruebas', 'listaPruebas', e.target.value)}
            rows={4}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 font-mono text-sm ${
              hasError('pruebas.listaPruebas') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="- Hemograma completo&#10;- Bioquímica básica&#10;- HbA1c"
            data-has-error={hasError('pruebas.listaPruebas')}
          />
          {hasError('pruebas.listaPruebas') && (
            <p className="mt-1 text-sm text-red-600">{getError('pruebas.listaPruebas')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Justificación Clínica *
          </label>
          <textarea
            value={formData.pruebas.justificacion}
            onChange={(e) => updateNested('pruebas', 'justificacion', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              hasError('pruebas.justificacion') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Estudio de control metabólico en paciente con sospecha de diabetes..."
            data-has-error={hasError('pruebas.justificacion')}
          />
          {hasError('pruebas.justificacion') && (
            <p className="mt-1 text-sm text-red-600">{getError('pruebas.justificacion')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Preparación Especial
          </label>
          <textarea
            value={formData.pruebas.preparacionEspecial || ''}
            onChange={(e) =>
              updateNested('pruebas', 'preparacionEspecial', e.target.value)
            }
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Ayuno de 12 horas, suspender metformina..."
          />
        </div>
      </fieldset>

      {/* ========== DATOS DE LA SOLICITUD ========== */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">📝</span>
          Datos de la Solicitud
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio Solicitante *
            </label>
            <input
              type="text"
              value={formData.solicitud.servicioSolicitante}
              onChange={(e) =>
                updateNested('solicitud', 'servicioSolicitante', e.target.value)
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                hasError('solicitud.servicioSolicitante') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Medicina Interna"
              data-has-error={hasError('solicitud.servicioSolicitante')}
            />
            {hasError('solicitud.servicioSolicitante') && (
              <p className="mt-1 text-sm text-red-600">
                {getError('solicitud.servicioSolicitante')}
              </p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio Destino
            </label>
            <input
              type="text"
              value={formData.solicitud.servicioDestino || ''}
              onChange={(e) =>
                updateNested('solicitud', 'servicioDestino', e.target.value)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Laboratorio de Bioquímica"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Prioridad *
          </label>
          <div className="flex gap-4">
            {(['Normal', 'Preferente', 'Urgente'] as const).map((prioridad) => (
              <label
                key={prioridad}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 border rounded-lg cursor-pointer transition-colors ${
                  formData.solicitud.prioridad === prioridad
                    ? prioridad === 'Urgente'
                      ? 'bg-red-50 border-red-500 text-red-700'
                      : prioridad === 'Preferente'
                      ? 'bg-amber-50 border-amber-500 text-amber-700'
                      : 'bg-purple-50 border-purple-500 text-purple-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="prioridad"
                  value={prioridad}
                  checked={formData.solicitud.prioridad === prioridad}
                  onChange={(e) => updateNested('solicitud', 'prioridad', e.target.value)}
                  className="sr-only"
                />
                <span className="text-lg">
                  {prioridad === 'Urgente' ? '🚨' : prioridad === 'Preferente' ? '⚡' : '📋'}
                </span>
                <span className="font-medium">{prioridad}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Observaciones
          </label>
          <textarea
            value={formData.solicitud.observaciones || ''}
            onChange={(e) => updateNested('solicitud', 'observaciones', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Notas adicionales para el laboratorio..."
          />
        </div>
      </fieldset>

      {/* ========== MÉDICO SOLICITANTE ========== */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">👨‍⚕️</span>
          Médico Solicitante
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del Médico *
            </label>
            <input
              type="text"
              value={formData.medico.nombre}
              onChange={(e) => updateNested('medico', 'nombre', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
                hasError('medico.nombre') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Dr. García López"
              data-has-error={hasError('medico.nombre')}
            />
            {hasError('medico.nombre') && (
              <p className="mt-1 text-sm text-red-600">{getError('medico.nombre')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº Colegiado
            </label>
            <input
              type="text"
              value={formData.medico.numeroColegiado || ''}
              onChange={(e) => updateNested('medico', 'numeroColegiado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="28012345"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio
            </label>
            <input
              type="text"
              value={formData.medico.servicio || ''}
              onChange={(e) => updateNested('medico', 'servicio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Medicina Interna"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Centro
            </label>
            <input
              type="text"
              value={formData.medico.centro || ''}
              onChange={(e) => updateNested('medico', 'centro', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Hospital General"
            />
          </div>
        </div>
      </fieldset>

      {/* ========== BOTÓN DE ENVÍO ========== */}
      <div className="pt-4 border-t border-gray-200">
        <button
          type="submit"
          disabled={loading}
          className={`w-full py-3 px-4 rounded-lg font-medium text-white transition-colors ${
            loading
              ? 'bg-gray-400 cursor-not-allowed'
              : 'bg-purple-600 hover:bg-purple-700'
          }`}
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
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
              Generando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              🔬 Generar Petición de Pruebas
              <span className="text-purple-200 text-sm">(Ctrl+Enter)</span>
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
