'use client';

/**
 * Formulario de Informe Social Sanitario
 *
 * Formulario completo para trabajo social sanitario,
 * incluyendo situación sociofamiliar, valoración e intervención.
 */

import { useState, useEffect, useCallback } from 'react';
import {
  informeSocialSchema,
  InformeSocialFormData,
  informeSocialInitialValues,
  RECURSOS_SOCIALES,
  TIPOS_CONVIVENCIA,
} from './schema';

interface InformeSocialFormProps {
  onGenerate: (data: InformeSocialFormData) => void;
  loading?: boolean;
}

export default function InformeSocialForm({
  onGenerate,
  loading = false,
}: InformeSocialFormProps) {
  const [formData, setFormData] = useState<InformeSocialFormData>(
    informeSocialInitialValues
  );
  const [errors, setErrors] = useState<Record<string, string>>({});

  // Actualizar campo anidado
  const updateNested = (
    section: keyof InformeSocialFormData,
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

  // Agregar recurso a la lista
  const agregarRecurso = (campo: 'recursosTramitados' | 'recursosRecomendados', recurso: string) => {
    const current = formData.intervencion[campo] || '';
    const newValue = current ? `${current}\n- ${recurso}` : `- ${recurso}`;
    updateNested('intervencion', campo, newValue);
  };

  // Manejar envío del formulario
  const handleSubmit = useCallback(
    (e?: React.FormEvent) => {
      e?.preventDefault();
      if (loading) return;

      // Validar con Zod
      const result = informeSocialSchema.safeParse(formData);

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
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                hasError('paciente.nombre') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="M.G.P."
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
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                  hasError('paciente.edad') ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder="78"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Sexo *
              </label>
              <select
                value={formData.paciente.sexo}
                onChange={(e) => updateNested('paciente', 'sexo', e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              >
                <option value="No especificado">No especificado</option>
                <option value="Masculino">Masculino</option>
                <option value="Femenino">Femenino</option>
              </select>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NHC
            </label>
            <input
              type="text"
              value={formData.paciente.identificador || ''}
              onChange={(e) => updateNested('paciente', 'identificador', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="123456"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado Civil
            </label>
            <select
              value={formData.paciente.estadoCivil || ''}
              onChange={(e) => updateNested('paciente', 'estadoCivil', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="">Seleccionar...</option>
              <option value="Soltero/a">Soltero/a</option>
              <option value="Casado/a">Casado/a</option>
              <option value="Viudo/a">Viudo/a</option>
              <option value="Divorciado/a">Divorciado/a</option>
              <option value="Pareja de hecho">Pareja de hecho</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Ocupación
            </label>
            <input
              type="text"
              value={formData.paciente.ocupacion || ''}
              onChange={(e) => updateNested('paciente', 'ocupacion', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Jubilado/a, Ama de casa..."
            />
          </div>
        </div>
      </fieldset>

      {/* ========== SITUACIÓN SOCIOFAMILIAR ========== */}
      <fieldset className="space-y-4 bg-pink-50 p-4 rounded-lg">
        <legend className="text-lg font-semibold text-pink-900 flex items-center gap-2">
          <span className="text-xl">🏠</span>
          Situación Sociofamiliar
        </legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Convivencia *
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {TIPOS_CONVIVENCIA.slice(0, 5).map((tipo) => (
              <button
                key={tipo}
                type="button"
                onClick={() => updateNested('situacion', 'convivencia', tipo)}
                className={`px-3 py-1 text-xs rounded-full transition-colors ${
                  formData.situacion.convivencia === tipo
                    ? 'bg-pink-500 text-white'
                    : 'bg-white border border-pink-200 hover:bg-pink-100'
                }`}
              >
                {tipo}
              </button>
            ))}
          </div>
          <input
            type="text"
            value={formData.situacion.convivencia}
            onChange={(e) => updateNested('situacion', 'convivencia', e.target.value)}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
              hasError('situacion.convivencia') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Vive solo/a en domicilio propio"
          />
          {hasError('situacion.convivencia') && (
            <p className="mt-1 text-sm text-red-600">{getError('situacion.convivencia')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Vivienda
          </label>
          <input
            type="text"
            value={formData.situacion.vivienda || ''}
            onChange={(e) => updateNested('situacion', 'vivienda', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            placeholder="Piso en propiedad, 3ª planta con ascensor, condiciones adecuadas"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Redes de Apoyo
            </label>
            <textarea
              value={formData.situacion.redesApoyo || ''}
              onChange={(e) => updateNested('situacion', 'redesApoyo', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Hija que vive cerca, vecinos colaboradores..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Cuidador Principal
            </label>
            <input
              type="text"
              value={formData.situacion.cuidadorPrincipal || ''}
              onChange={(e) => updateNested('situacion', 'cuidadorPrincipal', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Hija (50 años), con trabajo a jornada completa"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Situación Económica
          </label>
          <input
            type="text"
            value={formData.situacion.situacionEconomica || ''}
            onChange={(e) => updateNested('situacion', 'situacionEconomica', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            placeholder="Pensión de jubilación, ingresos suficientes para necesidades básicas"
          />
        </div>
      </fieldset>

      {/* ========== CONTEXTO CLÍNICO ========== */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">🏥</span>
          Contexto Clínico
        </legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Motivo de Ingreso/Intervención *
          </label>
          <textarea
            value={formData.contexto.motivoIngreso}
            onChange={(e) => updateNested('contexto', 'motivoIngreso', e.target.value)}
            rows={2}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
              hasError('contexto.motivoIngreso') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Ingreso por fractura de cadera, derivación de planta para valoración social"
          />
          {hasError('contexto.motivoIngreso') && (
            <p className="mt-1 text-sm text-red-600">{getError('contexto.motivoIngreso')}</p>
          )}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Grado de Dependencia *
            </label>
            <select
              value={formData.contexto.gradoDependencia}
              onChange={(e) => updateNested('contexto', 'gradoDependencia', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            >
              <option value="Independiente">Independiente</option>
              <option value="Dependencia leve">Dependencia leve</option>
              <option value="Dependencia moderada">Dependencia moderada</option>
              <option value="Dependencia severa">Dependencia severa</option>
              <option value="Gran dependencia">Gran dependencia</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Estado Cognitivo
            </label>
            <input
              type="text"
              value={formData.contexto.estadoCognitivo || ''}
              onChange={(e) => updateNested('contexto', 'estadoCognitivo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Deterioro cognitivo leve, orientado en persona"
            />
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Diagnósticos Relevantes
          </label>
          <input
            type="text"
            value={formData.contexto.diagnosticos || ''}
            onChange={(e) => updateNested('contexto', 'diagnosticos', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
            placeholder="Fractura de cadera, HTA, DM2, deterioro cognitivo leve"
          />
        </div>
      </fieldset>

      {/* ========== VALORACIÓN SOCIAL ========== */}
      <fieldset className="space-y-4 bg-purple-50 p-4 rounded-lg">
        <legend className="text-lg font-semibold text-purple-900 flex items-center gap-2">
          <span className="text-xl">📋</span>
          Valoración Social
        </legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Problemas Detectados *
          </label>
          <textarea
            value={formData.valoracion.problemasDetectados}
            onChange={(e) => updateNested('valoracion', 'problemasDetectados', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500 ${
              hasError('valoracion.problemasDetectados') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="- Riesgo de aislamiento social&#10;- Sobrecarga del cuidador principal&#10;- Necesidad de adaptación funcional del domicilio"
          />
          {hasError('valoracion.problemasDetectados') && (
            <p className="mt-1 text-sm text-red-600">{getError('valoracion.problemasDetectados')}</p>
          )}
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Necesidades Identificadas
          </label>
          <textarea
            value={formData.valoracion.necesidadesIdentificadas || ''}
            onChange={(e) => updateNested('valoracion', 'necesidadesIdentificadas', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
            placeholder="Apoyo en ABVD, supervisión, compañía, respiro familiar"
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Factores de Riesgo
            </label>
            <textarea
              value={formData.valoracion.factoresRiesgo || ''}
              onChange={(e) => updateNested('valoracion', 'factoresRiesgo', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Edad avanzada, vivir solo, deterioro cognitivo"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Factores Protectores
            </label>
            <textarea
              value={formData.valoracion.factoresProtectores || ''}
              onChange={(e) => updateNested('valoracion', 'factoresProtectores', e.target.value)}
              rows={2}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
              placeholder="Apoyo familiar disponible, vivienda adaptable, recursos económicos"
            />
          </div>
        </div>
      </fieldset>

      {/* ========== INTERVENCIÓN SOCIAL ========== */}
      <fieldset className="space-y-4 bg-green-50 p-4 rounded-lg">
        <legend className="text-lg font-semibold text-green-900 flex items-center gap-2">
          <span className="text-xl">🤝</span>
          Intervención Social
        </legend>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Objetivos
          </label>
          <textarea
            value={formData.intervencion.objetivos || ''}
            onChange={(e) => updateNested('intervencion', 'objetivos', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Garantizar alta segura, activar recursos comunitarios, prevenir reingresos"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recursos Tramitados
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {RECURSOS_SOCIALES.slice(0, 6).map((recurso) => (
              <button
                key={recurso}
                type="button"
                onClick={() => agregarRecurso('recursosTramitados', recurso)}
                className="px-2 py-1 text-xs bg-white border border-green-200 rounded-full hover:bg-green-100 transition-colors"
              >
                + {recurso}
              </button>
            ))}
          </div>
          <textarea
            value={formData.intervencion.recursosTramitados || ''}
            onChange={(e) => updateNested('intervencion', 'recursosTramitados', e.target.value)}
            rows={3}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="- Solicitud de SAD urgente&#10;- Contacto con Servicios Sociales de zona"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Recursos Recomendados
          </label>
          <div className="flex gap-2 mb-2 flex-wrap">
            {RECURSOS_SOCIALES.slice(6, 12).map((recurso) => (
              <button
                key={recurso}
                type="button"
                onClick={() => agregarRecurso('recursosRecomendados', recurso)}
                className="px-2 py-1 text-xs bg-white border border-green-200 rounded-full hover:bg-green-100 transition-colors"
              >
                + {recurso}
              </button>
            ))}
          </div>
          <textarea
            value={formData.intervencion.recursosRecomendados || ''}
            onChange={(e) => updateNested('intervencion', 'recursosRecomendados', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="- Valoración de Ley de Dependencia&#10;- Programa de respiro familiar"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Coordinaciones Realizadas
          </label>
          <textarea
            value={formData.intervencion.coordinaciones || ''}
            onChange={(e) => updateNested('intervencion', 'coordinaciones', e.target.value)}
            rows={2}
            className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
            placeholder="Contacto con CSS zona, derivación a Atención Primaria, coordinación con familia"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Plan al Alta *
          </label>
          <textarea
            value={formData.intervencion.planAlta}
            onChange={(e) => updateNested('intervencion', 'planAlta', e.target.value)}
            rows={3}
            className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 ${
              hasError('intervencion.planAlta') ? 'border-red-500' : 'border-gray-300'
            }`}
            placeholder="Alta a domicilio con SAD activado (2h/día), seguimiento por CSS zona, derivación a Atención Primaria para control evolutivo"
          />
          {hasError('intervencion.planAlta') && (
            <p className="mt-1 text-sm text-red-600">{getError('intervencion.planAlta')}</p>
          )}
        </div>
      </fieldset>

      {/* ========== PROFESIONAL ========== */}
      <fieldset className="space-y-4">
        <legend className="text-lg font-semibold text-gray-900 flex items-center gap-2">
          <span className="text-xl">👩‍💼</span>
          Trabajador/a Social
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre *
            </label>
            <input
              type="text"
              value={formData.profesional.nombre}
              onChange={(e) => updateNested('profesional', 'nombre', e.target.value)}
              className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500 ${
                hasError('profesional.nombre') ? 'border-red-500' : 'border-gray-300'
              }`}
              placeholder="María García López"
            />
            {hasError('profesional.nombre') && (
              <p className="mt-1 text-sm text-red-600">{getError('profesional.nombre')}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº Colegiado
            </label>
            <input
              type="text"
              value={formData.profesional.numeroColegiado || ''}
              onChange={(e) => updateNested('profesional', 'numeroColegiado', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="28-12345"
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
              value={formData.profesional.servicio || ''}
              onChange={(e) => updateNested('profesional', 'servicio', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Trabajo Social Sanitario"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Centro
            </label>
            <input
              type="text"
              value={formData.profesional.centro || ''}
              onChange={(e) => updateNested('profesional', 'centro', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-pink-500 focus:border-pink-500"
              placeholder="Hospital Universitario"
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
              : 'bg-pink-600 hover:bg-pink-700'
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
              👥 Generar Informe Social
              <span className="text-pink-200 text-sm">(Ctrl+Enter)</span>
            </span>
          )}
        </button>
      </div>
    </form>
  );
}
