'use client';

/**
 * Formulario de Nota Evolutiva (Formato SOAP)
 *
 * Formulario estructurado para notas de evolución clínica
 * siguiendo el formato SOAP (Subjetivo, Objetivo, Análisis, Plan).
 */

import { useState, useEffect, useCallback } from 'react';
import {
  notaEvolutivaSchema,
  NotaEvolutivaFormData,
  notaEvolutivaInitialValues,
  ESTADOS_GENERALES,
  CONSTANTES_EJEMPLO,
} from './schema';

interface NotaEvolutivaFormProps {
  onGenerate: (data: NotaEvolutivaFormData) => void;
  loading?: boolean;
}

export default function NotaEvolutivaForm({
  onGenerate,
  loading = false,
}: NotaEvolutivaFormProps) {
  const [formData, setFormData] = useState<NotaEvolutivaFormData>(
    notaEvolutivaInitialValues
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Actualizar campo anidado
  const updateNested = (
    section: keyof NotaEvolutivaFormData,
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

  // Insertar ejemplo de constantes
  const insertarConstantesEjemplo = () => {
    updateNested('objetivo', 'constantesVitales', CONSTANTES_EJEMPLO);
  };

  // Manejar envío del formulario
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (loading) return;

      // Validar con Zod
      const result = notaEvolutivaSchema.safeParse(formData);

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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                hasError('paciente.nombre') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="J.G.M."
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
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
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
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
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="123456"
          />
        </div>
      </fieldset>

      {/* ========== CONTEXTO ========== */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">📅</span>
          Contexto
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha *
            </label>
            <input
              type="date"
              value={formData.contexto.fechaNota}
              onChange={(e) => updateNested('contexto', 'fechaNota', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nota Evolutiva #
            </label>
            <input
              type="text"
              value={formData.contexto.numeroNota || ''}
              onChange={(e) => updateNested('contexto', 'numeroNota', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="3"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Días de Ingreso
            </label>
            <input
              type="number"
              min="0"
              value={formData.contexto.diasIngreso || ''}
              onChange={(e) =>
                updateNested('contexto', 'diasIngreso', parseInt(e.target.value) || 0)
              }
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="5"
            />
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio *
            </label>
            <input
              type="text"
              value={formData.contexto.servicio}
              onChange={(e) => updateNested('contexto', 'servicio', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                hasError('contexto.servicio') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Medicina Interna"
            />
            {hasError('contexto.servicio') && (
              <p className="mt-1 text-sm text-red-600">{getError('contexto.servicio')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnóstico Principal *
            </label>
            <input
              type="text"
              value={formData.contexto.diagnosticoPrincipal}
              onChange={(e) =>
                updateNested('contexto', 'diagnosticoPrincipal', e.target.value)
              }
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                hasError('contexto.diagnosticoPrincipal') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Neumonía adquirida en la comunidad"
            />
            {hasError('contexto.diagnosticoPrincipal') && (
              <p className="mt-1 text-sm text-red-600">
                {getError('contexto.diagnosticoPrincipal')}
              </p>
            )}
          </div>
        </div>
      </fieldset>

      {/* ========== S - SUBJETIVO ========== */}
      <fieldset className="space-y-4 bg-blue-50 p-4 rounded-lg">
        <legend className="text-lg font-semibold text-blue-900 flex items-center gap-2">
          <span className="w-8 h-8 bg-blue-600 text-white rounded-full flex items-center justify-center font-bold">S</span>
          Subjetivo
          <span className="text-sm font-normal text-blue-600">(Lo que refiere el paciente)</span>
        </legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Síntomas actuales
          </label>
          <textarea
            value={formData.subjetivo.sintomas || ''}
            onChange={(e) => updateNested('subjetivo', 'sintomas', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            placeholder="El paciente refiere mejoría de la disnea, persiste tos productiva..."
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evolución subjetiva
            </label>
            <input
              type="text"
              value={formData.subjetivo.evolucion || ''}
              onChange={(e) => updateNested('subjetivo', 'evolucion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Mejor que ayer, se nota con más fuerzas"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tolerancia (oral, dolor...)
            </label>
            <input
              type="text"
              value={formData.subjetivo.tolerancia || ''}
              onChange={(e) => updateNested('subjetivo', 'tolerancia', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Buena tolerancia oral, sin dolor"
            />
          </div>
        </div>
      </fieldset>

      {/* ========== O - OBJETIVO ========== */}
      <fieldset className="space-y-4 bg-green-50 p-4 rounded-lg">
        <legend className="text-lg font-semibold text-green-900 flex items-center gap-2">
          <span className="w-8 h-8 bg-green-600 text-white rounded-full flex items-center justify-center font-bold">O</span>
          Objetivo
          <span className="text-sm font-normal text-green-600">(Hallazgos clínicos)</span>
        </legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Estado General
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {ESTADOS_GENERALES.slice(0, 4).map((estado) => (
              <button
                key={estado}
                type="button"
                onClick={() => {
                  const current = formData.objetivo.estadoGeneral || '';
                  const newValue = current ? `${current}, ${estado.toLowerCase()}` : estado;
                  updateNested('objetivo', 'estadoGeneral', newValue);
                }}
                className="px-2 py-1 text-xs bg-green-100 border border-green-200 rounded-full hover:bg-green-200 transition-colors"
              >
                + {estado}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={formData.objetivo.estadoGeneral || ''}
            onChange={(e) => updateNested('objetivo', 'estadoGeneral', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Buen estado general, consciente, orientado, colaborador"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Constantes Vitales
            <button
              type="button"
              onClick={insertarConstantesEjemplo}
              className="ml-2 text-xs text-green-600 hover:text-green-800 underline"
            >
              (Insertar ejemplo)
            </button>
          </label>
          <input
            type="text"
            value={formData.objetivo.constantesVitales || ''}
            onChange={(e) => updateNested('objetivo', 'constantesVitales', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 font-mono text-sm"
            placeholder="TA: 120/80 mmHg | FC: 75 lpm | FR: 16 rpm | Tª: 36.5°C | SatO2: 98%"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Exploración Física
          </label>
          <textarea
            value={formData.objetivo.exploracionFisica || ''}
            onChange={(e) => updateNested('objetivo', 'exploracionFisica', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="AC: rítmica, sin soplos. AP: crepitantes bibasales en disminución..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Pruebas Recientes
          </label>
          <textarea
            value={formData.objetivo.pruebasRecientes || ''}
            onChange={(e) => updateNested('objetivo', 'pruebasRecientes', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Analítica: Leucocitos 9.500, PCR 25 (descendiendo)..."
          />
        </div>
      </fieldset>

      {/* ========== A - ANÁLISIS ========== */}
      <fieldset className="space-y-4 bg-amber-50 p-4 rounded-lg">
        <legend className="text-lg font-semibold text-amber-900 flex items-center gap-2">
          <span className="w-8 h-8 bg-amber-600 text-white rounded-full flex items-center justify-center font-bold">A</span>
          Análisis
          <span className="text-sm font-normal text-amber-600">(Valoración clínica)</span>
        </legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Evolución General *
          </label>
          <div className="flex gap-2">
            {(['Favorable', 'Estable', 'Desfavorable', 'Crítica'] as const).map((evol) => (
              <label
                key={evol}
                className={`flex-1 flex items-center justify-center gap-2 px-3 py-2 border rounded-lg cursor-pointer transition-colors text-sm ${
                  formData.analisis.evolucionGeneral === evol
                    ? evol === 'Favorable'
                      ? 'bg-green-100 border-green-500 text-green-700'
                      : evol === 'Estable'
                      ? 'bg-amber-100 border-amber-500 text-amber-700'
                      : evol === 'Desfavorable'
                      ? 'bg-orange-100 border-orange-500 text-orange-700'
                      : 'bg-red-100 border-red-500 text-red-700'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
              >
                <input
                  type="radio"
                  name="evolucionGeneral"
                  value={evol}
                  checked={formData.analisis.evolucionGeneral === evol}
                  onChange={(e) => updateNested('analisis', 'evolucionGeneral', e.target.value)}
                  className="sr-only"
                />
                <span>
                  {evol === 'Favorable' ? '📈' : evol === 'Estable' ? '➡️' : evol === 'Desfavorable' ? '📉' : '🚨'}
                </span>
                <span className="font-medium">{evol}</span>
              </label>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Impresión Clínica *
          </label>
          <textarea
            value={formData.analisis.impresionClinica}
            onChange={(e) => updateNested('analisis', 'impresionClinica', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
              hasError('analisis.impresionClinica') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Paciente con neumonía adquirida en la comunidad en evolución favorable con tratamiento antibiótico..."
          />
          {hasError('analisis.impresionClinica') && (
            <p className="mt-1 text-sm text-red-600">{getError('analisis.impresionClinica')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Problemas Activos
          </label>
          <textarea
            value={formData.analisis.problemasActivos || ''}
            onChange={(e) => updateNested('analisis', 'problemasActivos', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
            placeholder="1. NAC en resolución&#10;2. Hiperglucemia en contexto de infección"
          />
        </div>
      </fieldset>

      {/* ========== P - PLAN ========== */}
      <fieldset className="space-y-4 bg-purple-50 p-4 rounded-lg">
        <legend className="text-lg font-semibold text-purple-900 flex items-center gap-2">
          <span className="w-8 h-8 bg-purple-600 text-white rounded-full flex items-center justify-center font-bold">P</span>
          Plan
          <span className="text-sm font-normal text-purple-600">(Actuación)</span>
        </legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Tratamiento Actual
          </label>
          <textarea
            value={formData.plan.tratamientoActual || ''}
            onChange={(e) => updateNested('plan', 'tratamientoActual', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="- Levofloxacino 500mg/24h IV&#10;- Paracetamol 1g/8h si fiebre&#10;- Oxigenoterapia 2L/min si SatO2 < 94%"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Cambios en Tratamiento
          </label>
          <textarea
            value={formData.plan.cambiosTratamiento || ''}
            onChange={(e) => updateNested('plan', 'cambiosTratamiento', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Se retira oxigenoterapia, buena saturación basal"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Pruebas Pendientes
            </label>
            <textarea
              value={formData.plan.pruebasPendientes || ''}
              onChange={(e) => updateNested('plan', 'pruebasPendientes', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Analítica de control mañana"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Interconsultas
            </label>
            <textarea
              value={formData.plan.interconsultas || ''}
              onChange={(e) => updateNested('plan', 'interconsultas', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Pendiente valoración por Neumología"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Previsión de Alta
          </label>
          <input
            type="text"
            value={formData.plan.previsionAlta || ''}
            onChange={(e) => updateNested('plan', 'previsionAlta', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Si evolución favorable, alta en 48-72h con antibiótico oral"
          />
        </div>
      </fieldset>

      {/* ========== MÉDICO RESPONSABLE ========== */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">👨‍⚕️</span>
          Médico Responsable
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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500 ${
                hasError('medico.nombre') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="Dr. García López"
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
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              placeholder="28012345"
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
              : 'bg-amber-600 hover:bg-amber-700'
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
              📝 Generar Nota Evolutiva
              <span className="text-amber-200 text-sm">(Ctrl+Enter)</span>
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
