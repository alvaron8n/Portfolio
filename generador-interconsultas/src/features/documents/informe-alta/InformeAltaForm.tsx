'use client';

/**
 * Formulario para Informe de Alta Hospitalaria
 *
 * Secciones:
 * 1. Datos del paciente
 * 2. Datos del episodio (fechas, servicio)
 * 3. Diagnósticos
 * 4. Procedimientos y evolución
 * 5. Tratamiento y recomendaciones al alta
 * 6. Datos del médico
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import {
  InformeAltaFormData,
  informeAltaSchema,
  informeAltaInitialValues,
} from './schema';
import { formatDateForInput, calcularDiasEntre } from '../base/types';

interface InformeAltaFormProps {
  initialValues?: Partial<InformeAltaFormData>;
  onGenerate: (data: InformeAltaFormData) => void;
  loading?: boolean;
}

type Sexo = 'Masculino' | 'Femenino' | 'No especificado';
const sexos: Sexo[] = ['Masculino', 'Femenino', 'No especificado'];

export default function InformeAltaForm({
  initialValues,
  onGenerate,
  loading = false,
}: InformeAltaFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const [formData, setFormData] = useState<InformeAltaFormData>({
    ...informeAltaInitialValues,
    ...initialValues,
  });
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [diasEstancia, setDiasEstancia] = useState(0);

  // Calcular días de estancia cuando cambian las fechas
  useEffect(() => {
    if (formData.episodio.fechaIngreso && formData.episodio.fechaAlta) {
      const dias = calcularDiasEntre(
        formData.episodio.fechaIngreso,
        formData.episodio.fechaAlta
      );
      setDiasEstancia(dias);
    }
  }, [formData.episodio.fechaIngreso, formData.episodio.fechaAlta]);

  // Atajo de teclado: Ctrl+Enter para generar
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, []);

  // Actualizar campo anidado
  const updateField = useCallback(<T extends keyof InformeAltaFormData>(
    section: T,
    field: keyof InformeAltaFormData[T],
    value: InformeAltaFormData[T][keyof InformeAltaFormData[T]]
  ) => {
    setFormData(prev => ({
      ...prev,
      [section]: {
        ...(prev[section] as object),
        [field]: value,
      },
    }));
    // Limpiar error del campo
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[`${section}.${String(field)}`];
      return newErrors;
    });
  }, []);

  // Actualizar campo simple
  const updateSimpleField = useCallback((field: keyof InformeAltaFormData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value,
    }));
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field];
      return newErrors;
    });
  }, []);

  // Enviar formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    // Validar con Zod
    const result = informeAltaSchema.safeParse(formData);

    if (!result.success) {
      const newErrors: Record<string, string> = {};
      result.error.issues.forEach((err) => {
        const path = err.path.join('.');
        newErrors[path] = err.message;
      });
      setErrors(newErrors);

      // Scroll al primer error
      const firstErrorField = document.querySelector('[data-has-error="true"]');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors({});
    onGenerate(result.data);
  };

  // Limpiar formulario
  const handleClear = () => {
    setFormData({
      ...informeAltaInitialValues,
      episodio: {
        ...informeAltaInitialValues.episodio,
        fechaIngreso: formatDateForInput(),
        fechaAlta: formatDateForInput(),
      },
    });
    setErrors({});
  };

  // Obtener error de un campo
  const getError = (path: string) => errors[path];
  const hasError = (path: string) => !!errors[path];

  // Clase para inputs
  const inputClass = (path: string) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors ${
      hasError(path) ? 'border-red-500 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <form ref={formRef} onSubmit={handleSubmit} className="space-y-6">
      {/* Errores globales */}
      {Object.keys(errors).length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">
            Por favor, corrija los errores marcados en el formulario.
          </p>
        </div>
      )}

      {/* Sección: Datos del Paciente */}
      <fieldset className="p-4 border border-gray-200 rounded-lg">
        <legend className="px-2 text-lg font-semibold text-gray-900">
          Datos del Paciente
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Nombre */}
          <div data-has-error={hasError('paciente.nombre')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre / Iniciales <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.paciente.nombre}
              onChange={e => updateField('paciente', 'nombre', e.target.value)}
              placeholder="Ej: J.G.M."
              className={inputClass('paciente.nombre')}
            />
            {getError('paciente.nombre') && (
              <p className="mt-1 text-sm text-red-600">{getError('paciente.nombre')}</p>
            )}
          </div>

          {/* Edad */}
          <div data-has-error={hasError('paciente.edad')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Edad (años) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="150"
              value={formData.paciente.edad || ''}
              onChange={e => updateField('paciente', 'edad', parseInt(e.target.value) || 0)}
              className={inputClass('paciente.edad')}
            />
            {getError('paciente.edad') && (
              <p className="mt-1 text-sm text-red-600">{getError('paciente.edad')}</p>
            )}
          </div>

          {/* Sexo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sexo
            </label>
            <select
              value={formData.paciente.sexo}
              onChange={e => updateField('paciente', 'sexo', e.target.value as Sexo)}
              className={inputClass('paciente.sexo')}
            >
              {sexos.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* NHC */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              NHC / Historia Clínica
            </label>
            <input
              type="text"
              value={formData.paciente.identificador}
              onChange={e => updateField('paciente', 'identificador', e.target.value)}
              placeholder="Opcional"
              className={inputClass('paciente.identificador')}
            />
          </div>
        </div>
      </fieldset>

      {/* Sección: Episodio */}
      <fieldset className="p-4 border border-gray-200 rounded-lg">
        <legend className="px-2 text-lg font-semibold text-gray-900">
          Datos del Episodio
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          {/* Fecha ingreso */}
          <div data-has-error={hasError('episodio.fechaIngreso')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de ingreso <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.episodio.fechaIngreso}
              onChange={e => updateField('episodio', 'fechaIngreso', e.target.value)}
              className={inputClass('episodio.fechaIngreso')}
            />
            {getError('episodio.fechaIngreso') && (
              <p className="mt-1 text-sm text-red-600">{getError('episodio.fechaIngreso')}</p>
            )}
          </div>

          {/* Fecha alta */}
          <div data-has-error={hasError('episodio.fechaAlta')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha de alta <span className="text-red-500">*</span>
            </label>
            <input
              type="date"
              value={formData.episodio.fechaAlta}
              onChange={e => updateField('episodio', 'fechaAlta', e.target.value)}
              className={inputClass('episodio.fechaAlta')}
            />
            {getError('episodio.fechaAlta') && (
              <p className="mt-1 text-sm text-red-600">{getError('episodio.fechaAlta')}</p>
            )}
          </div>

          {/* Días de estancia (calculado) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Días de estancia
            </label>
            <input
              type="text"
              value={`${diasEstancia} días`}
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>

          {/* Servicio */}
          <div data-has-error={hasError('episodio.servicioIngreso')} className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio de ingreso <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.episodio.servicioIngreso}
              onChange={e => updateField('episodio', 'servicioIngreso', e.target.value)}
              placeholder="Ej: Medicina Interna, Cardiología..."
              className={inputClass('episodio.servicioIngreso')}
            />
            {getError('episodio.servicioIngreso') && (
              <p className="mt-1 text-sm text-red-600">{getError('episodio.servicioIngreso')}</p>
            )}
          </div>

          {/* Motivo ingreso */}
          <div className="md:col-span-3">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo de ingreso
            </label>
            <input
              type="text"
              value={formData.episodio.motivoIngreso}
              onChange={e => updateField('episodio', 'motivoIngreso', e.target.value)}
              placeholder="Opcional - Motivo principal del ingreso"
              className={inputClass('episodio.motivoIngreso')}
            />
          </div>
        </div>
      </fieldset>

      {/* Sección: Diagnósticos */}
      <fieldset className="p-4 border border-gray-200 rounded-lg">
        <legend className="px-2 text-lg font-semibold text-gray-900">
          Diagnósticos
        </legend>

        <div className="space-y-4 mt-4">
          {/* Diagnóstico principal */}
          <div data-has-error={hasError('diagnosticos.principal')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnóstico principal <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.diagnosticos.principal}
              onChange={e => updateField('diagnosticos', 'principal', e.target.value)}
              rows={2}
              placeholder="Diagnóstico principal al alta..."
              className={inputClass('diagnosticos.principal')}
            />
            {getError('diagnosticos.principal') && (
              <p className="mt-1 text-sm text-red-600">{getError('diagnosticos.principal')}</p>
            )}
          </div>

          {/* Diagnósticos secundarios */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Diagnósticos secundarios
            </label>
            <textarea
              value={formData.diagnosticos.secundarios}
              onChange={e => updateField('diagnosticos', 'secundarios', e.target.value)}
              rows={2}
              placeholder="Otros diagnósticos relevantes..."
              className={inputClass('diagnosticos.secundarios')}
            />
          </div>
        </div>
      </fieldset>

      {/* Sección: Procedimientos y Evolución */}
      <fieldset className="p-4 border border-gray-200 rounded-lg">
        <legend className="px-2 text-lg font-semibold text-gray-900">
          Evolución Clínica
        </legend>

        <div className="space-y-4 mt-4">
          {/* Procedimientos */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Procedimientos realizados
            </label>
            <textarea
              value={formData.procedimientos}
              onChange={e => updateSimpleField('procedimientos', e.target.value)}
              rows={3}
              placeholder="Intervenciones, procedimientos diagnósticos/terapéuticos..."
              className={inputClass('procedimientos')}
            />
          </div>

          {/* Evolución */}
          <div data-has-error={hasError('evolucion')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Evolución durante el ingreso <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.evolucion}
              onChange={e => updateSimpleField('evolucion', e.target.value)}
              rows={4}
              placeholder="Resumen de la evolución clínica durante el ingreso..."
              className={inputClass('evolucion')}
            />
            {getError('evolucion') && (
              <p className="mt-1 text-sm text-red-600">{getError('evolucion')}</p>
            )}
          </div>
        </div>
      </fieldset>

      {/* Sección: Tratamiento y Recomendaciones al Alta */}
      <fieldset className="p-4 border border-gray-200 rounded-lg">
        <legend className="px-2 text-lg font-semibold text-gray-900">
          Tratamiento y Recomendaciones al Alta
        </legend>

        <div className="space-y-4 mt-4">
          {/* Tratamiento */}
          <div data-has-error={hasError('alta.tratamiento')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tratamiento al alta <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.alta.tratamiento}
              onChange={e => updateField('alta', 'tratamiento', e.target.value)}
              rows={4}
              placeholder="Medicación y pauta posológica al alta..."
              className={inputClass('alta.tratamiento')}
            />
            {getError('alta.tratamiento') && (
              <p className="mt-1 text-sm text-red-600">{getError('alta.tratamiento')}</p>
            )}
          </div>

          {/* Recomendaciones */}
          <div data-has-error={hasError('alta.recomendaciones')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Recomendaciones <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.alta.recomendaciones}
              onChange={e => updateField('alta', 'recomendaciones', e.target.value)}
              rows={3}
              placeholder="Recomendaciones al alta (dieta, actividad, cuidados...)..."
              className={inputClass('alta.recomendaciones')}
            />
            {getError('alta.recomendaciones') && (
              <p className="mt-1 text-sm text-red-600">{getError('alta.recomendaciones')}</p>
            )}
          </div>

          {/* Signos de alarma */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Signos de alarma
            </label>
            <textarea
              value={formData.alta.signosAlarma}
              onChange={e => updateField('alta', 'signosAlarma', e.target.value)}
              rows={2}
              placeholder="Signos que deben motivar consulta urgente..."
              className={inputClass('alta.signosAlarma')}
            />
          </div>

          {/* Citas seguimiento */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Citas de seguimiento
            </label>
            <textarea
              value={formData.alta.citasSeguimiento}
              onChange={e => updateField('alta', 'citasSeguimiento', e.target.value)}
              rows={2}
              placeholder="Citas programadas, controles pendientes..."
              className={inputClass('alta.citasSeguimiento')}
            />
          </div>
        </div>
      </fieldset>

      {/* Sección: Datos del Médico */}
      <fieldset className="p-4 border border-gray-200 rounded-lg">
        <legend className="px-2 text-lg font-semibold text-gray-900">
          Datos del Médico
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Nombre */}
          <div data-has-error={hasError('medico.nombre')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del médico <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.medico.nombre}
              onChange={e => updateField('medico', 'nombre', e.target.value)}
              placeholder="Dr./Dra. Nombre Apellidos"
              className={inputClass('medico.nombre')}
            />
            {getError('medico.nombre') && (
              <p className="mt-1 text-sm text-red-600">{getError('medico.nombre')}</p>
            )}
          </div>

          {/* Servicio */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio
            </label>
            <input
              type="text"
              value={formData.medico.servicio}
              onChange={e => updateField('medico', 'servicio', e.target.value)}
              placeholder="Ej: Medicina Interna"
              className={inputClass('medico.servicio')}
            />
          </div>

          {/* Nº Colegiado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº de colegiado
            </label>
            <input
              type="text"
              value={formData.medico.numeroColegiado}
              onChange={e => updateField('medico', 'numeroColegiado', e.target.value)}
              placeholder="Opcional"
              className={inputClass('medico.numeroColegiado')}
            />
          </div>

          {/* Centro */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Centro / Hospital
            </label>
            <input
              type="text"
              value={formData.medico.centro}
              onChange={e => updateField('medico', 'centro', e.target.value)}
              placeholder="Ej: Hospital Universitario..."
              className={inputClass('medico.centro')}
            />
          </div>
        </div>
      </fieldset>

      {/* Botones de acción */}
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          type="submit"
          disabled={loading}
          className="flex-1 px-6 py-3 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? (
            <span className="flex items-center justify-center gap-2">
              <svg className="animate-spin h-5 w-5" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Generando...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              Generar Informe de Alta
              <kbd className="hidden sm:inline-flex items-center px-2 py-0.5 text-xs bg-green-700 rounded">
                Ctrl+Enter
              </kbd>
            </span>
          )}
        </button>

        <button
          type="button"
          onClick={handleClear}
          disabled={loading}
          className="px-6 py-3 bg-gray-100 text-gray-700 font-medium rounded-lg hover:bg-gray-200 focus:ring-4 focus:ring-gray-200 transition-colors disabled:opacity-50"
        >
          Limpiar formulario
        </button>
      </div>
    </form>
  );
}
