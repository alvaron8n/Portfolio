'use client';

/**
 * Componente de formulario para generar interconsultas
 *
 * Incluye todos los campos necesarios organizados en secciones:
 * - Datos generales (servicio destino, prioridad)
 * - Datos del paciente
 * - Información clínica
 * - Datos del médico
 */

import { useState, useEffect } from 'react';
import {
  InterconsultaFormData,
  Prioridad,
  Sexo,
  ServicioDestino,
  ValidationError
} from '@/types';
import { validateInterconsultaForm, getFieldError } from '@/lib/validation';
import { getServiciosDestino } from '@/lib/storage';

interface InterconsultaFormProps {
  initialValues?: Partial<InterconsultaFormData>;
  onGenerate: (data: InterconsultaFormData) => void;
  loading?: boolean;
}

const prioridades: Prioridad[] = ['Urgente', 'Preferente', 'Normal'];
const sexos: Sexo[] = ['Masculino', 'Femenino', 'No especificado'];

const initialFormState: InterconsultaFormData = {
  tipoDocumento: 'interconsulta',
  servicioRemitente: '',
  servicioDestino: '',
  prioridad: 'Normal',
  paciente: {
    nombre: '',
    edad: 0,
    sexo: 'No especificado',
    identificador: '',
  },
  informacionClinica: {
    motivoPrincipal: '',
    antecedentesRelevantes: '',
    exploracionDatosRelevantes: '',
    presuncionDiagnostica: '',
    tratamientoActual: '',
  },
  medico: {
    nombre: '',
    servicio: '',
    numeroColegiado: '',
    centro: '',
  },
};

export default function InterconsultaForm({
  initialValues,
  onGenerate,
  loading = false,
}: InterconsultaFormProps) {
  const [formData, setFormData] = useState<InterconsultaFormData>({
    ...initialFormState,
    ...initialValues,
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [servicios, setServicios] = useState<ServicioDestino[]>([]);

  // Cargar servicios destino al montar el componente
  useEffect(() => {
    setServicios(getServiciosDestino());
  }, []);

  // Actualizar datos generales
  const updateField = <K extends keyof InterconsultaFormData>(
    field: K,
    value: InterconsultaFormData[K]
  ) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Limpiar errores del campo al modificarlo
    setErrors(prev => prev.filter(e => !e.field.startsWith(field as string)));
  };

  // Actualizar datos del paciente
  const updatePaciente = <K extends keyof InterconsultaFormData['paciente']>(
    field: K,
    value: InterconsultaFormData['paciente'][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      paciente: { ...prev.paciente, [field]: value },
    }));
    setErrors(prev => prev.filter(e => e.field !== `paciente.${field}`));
  };

  // Actualizar información clínica
  const updateInfoClinica = <K extends keyof InterconsultaFormData['informacionClinica']>(
    field: K,
    value: InterconsultaFormData['informacionClinica'][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      informacionClinica: { ...prev.informacionClinica, [field]: value },
    }));
    setErrors(prev => prev.filter(e => e.field !== `informacionClinica.${field}`));
  };

  // Actualizar datos del médico
  const updateMedico = <K extends keyof InterconsultaFormData['medico']>(
    field: K,
    value: InterconsultaFormData['medico'][K]
  ) => {
    setFormData(prev => ({
      ...prev,
      medico: { ...prev.medico, [field]: value },
    }));
    setErrors(prev => prev.filter(e => e.field !== `medico.${field}`));
  };

  // Manejar envío del formulario
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const validation = validateInterconsultaForm(formData);

    if (!validation.isValid) {
      setErrors(validation.errors);
      // Scroll al primer error
      const firstErrorField = document.querySelector('[data-has-error="true"]');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }

    setErrors([]);
    onGenerate(formData);
  };

  // Limpiar formulario
  const handleClear = () => {
    setFormData(initialFormState);
    setErrors([]);
  };

  // Renderizar mensaje de error
  const renderError = (field: string) => {
    const error = getFieldError(errors, field);
    if (!error) return null;
    return <p className="mt-1 text-sm text-red-600">{error}</p>;
  };

  // Clase base para inputs
  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors ${
      getFieldError(errors, field) ? 'border-red-500 bg-red-50' : 'border-gray-300'
    }`;

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Errores globales */}
      {errors.length > 0 && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-800 font-medium">
            Por favor, corrija los siguientes errores:
          </p>
          <ul className="mt-2 list-disc list-inside text-red-700 text-sm">
            {errors.map((error, index) => (
              <li key={index}>{error.message}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Sección: Datos Generales */}
      <fieldset className="p-4 border border-gray-200 rounded-lg">
        <legend className="px-2 text-lg font-semibold text-gray-900">
          Datos Generales
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Tipo de documento (bloqueado) */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tipo de documento
            </label>
            <input
              type="text"
              value="Interconsulta"
              disabled
              className="w-full px-3 py-2 border border-gray-200 rounded-lg bg-gray-100 text-gray-600"
            />
          </div>

          {/* Prioridad */}
          <div data-has-error={!!getFieldError(errors, 'prioridad')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Prioridad <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.prioridad}
              onChange={e => updateField('prioridad', e.target.value as Prioridad)}
              className={inputClass('prioridad')}
            >
              {prioridades.map(p => (
                <option key={p} value={p}>{p}</option>
              ))}
            </select>
            {renderError('prioridad')}
          </div>

          {/* Servicio remitente */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio remitente
            </label>
            <input
              type="text"
              value={formData.servicioRemitente}
              onChange={e => updateField('servicioRemitente', e.target.value)}
              placeholder="Ej: Atención Primaria, Urgencias..."
              className={inputClass('servicioRemitente')}
            />
          </div>

          {/* Servicio destino */}
          <div data-has-error={!!getFieldError(errors, 'servicioDestino')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio destino <span className="text-red-500">*</span>
            </label>
            <select
              value={formData.servicioDestino}
              onChange={e => updateField('servicioDestino', e.target.value)}
              className={inputClass('servicioDestino')}
            >
              <option value="">Seleccione un servicio...</option>
              {servicios.map(s => (
                <option key={s.id} value={s.nombre}>{s.nombre}</option>
              ))}
            </select>
            {renderError('servicioDestino')}
          </div>
        </div>
      </fieldset>

      {/* Sección: Datos del Paciente */}
      <fieldset className="p-4 border border-gray-200 rounded-lg">
        <legend className="px-2 text-lg font-semibold text-gray-900">
          Datos del Paciente
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Nombre/iniciales */}
          <div data-has-error={!!getFieldError(errors, 'paciente.nombre')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre / Iniciales <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.paciente.nombre}
              onChange={e => updatePaciente('nombre', e.target.value)}
              placeholder="Ej: J.G.M. o nombre completo"
              className={inputClass('paciente.nombre')}
            />
            {renderError('paciente.nombre')}
          </div>

          {/* Edad */}
          <div data-has-error={!!getFieldError(errors, 'paciente.edad')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Edad (años) <span className="text-red-500">*</span>
            </label>
            <input
              type="number"
              min="0"
              max="150"
              value={formData.paciente.edad || ''}
              onChange={e => updatePaciente('edad', parseInt(e.target.value) || 0)}
              placeholder="Ej: 65"
              className={inputClass('paciente.edad')}
            />
            {renderError('paciente.edad')}
          </div>

          {/* Sexo */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Sexo
            </label>
            <select
              value={formData.paciente.sexo}
              onChange={e => updatePaciente('sexo', e.target.value as Sexo)}
              className={inputClass('paciente.sexo')}
            >
              {sexos.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
          </div>

          {/* Identificador */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              ID / Historia Clínica
            </label>
            <input
              type="text"
              value={formData.paciente.identificador}
              onChange={e => updatePaciente('identificador', e.target.value)}
              placeholder="Opcional"
              className={inputClass('paciente.identificador')}
            />
          </div>
        </div>
      </fieldset>

      {/* Sección: Información Clínica */}
      <fieldset className="p-4 border border-gray-200 rounded-lg">
        <legend className="px-2 text-lg font-semibold text-gray-900">
          Información Clínica
        </legend>

        <div className="space-y-4 mt-4">
          {/* Motivo principal */}
          <div data-has-error={!!getFieldError(errors, 'informacionClinica.motivoPrincipal')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Motivo principal de la interconsulta <span className="text-red-500">*</span>
            </label>
            <textarea
              value={formData.informacionClinica.motivoPrincipal}
              onChange={e => updateInfoClinica('motivoPrincipal', e.target.value)}
              rows={3}
              placeholder="Describa el motivo principal por el que solicita la interconsulta..."
              className={inputClass('informacionClinica.motivoPrincipal')}
            />
            {renderError('informacionClinica.motivoPrincipal')}
          </div>

          {/* Antecedentes relevantes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Antecedentes relevantes
            </label>
            <textarea
              value={formData.informacionClinica.antecedentesRelevantes}
              onChange={e => updateInfoClinica('antecedentesRelevantes', e.target.value)}
              rows={3}
              placeholder="Antecedentes médicos, quirúrgicos, familiares relevantes para esta consulta..."
              className={inputClass('informacionClinica.antecedentesRelevantes')}
            />
          </div>

          {/* Exploración / datos relevantes */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Exploración / Datos relevantes
            </label>
            <textarea
              value={formData.informacionClinica.exploracionDatosRelevantes}
              onChange={e => updateInfoClinica('exploracionDatosRelevantes', e.target.value)}
              rows={3}
              placeholder="Hallazgos de exploración física, pruebas complementarias, analíticas..."
              className={inputClass('informacionClinica.exploracionDatosRelevantes')}
            />
          </div>

          {/* Presunción diagnóstica */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Presunción diagnóstica
            </label>
            <textarea
              value={formData.informacionClinica.presuncionDiagnostica}
              onChange={e => updateInfoClinica('presuncionDiagnostica', e.target.value)}
              rows={2}
              placeholder="Diagnóstico de sospecha o diagnósticos diferenciales..."
              className={inputClass('informacionClinica.presuncionDiagnostica')}
            />
          </div>

          {/* Tratamiento actual */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tratamiento actual relevante
            </label>
            <textarea
              value={formData.informacionClinica.tratamientoActual}
              onChange={e => updateInfoClinica('tratamientoActual', e.target.value)}
              rows={2}
              placeholder="Medicación actual relevante para la interconsulta..."
              className={inputClass('informacionClinica.tratamientoActual')}
            />
          </div>
        </div>
      </fieldset>

      {/* Sección: Datos del Médico */}
      <fieldset className="p-4 border border-gray-200 rounded-lg">
        <legend className="px-2 text-lg font-semibold text-gray-900">
          Datos del Médico Remitente
        </legend>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          {/* Nombre del médico */}
          <div data-has-error={!!getFieldError(errors, 'medico.nombre')}>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nombre del médico <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={formData.medico.nombre}
              onChange={e => updateMedico('nombre', e.target.value)}
              placeholder="Dr./Dra. Nombre Apellidos"
              className={inputClass('medico.nombre')}
            />
            {renderError('medico.nombre')}
          </div>

          {/* Servicio del médico */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Servicio
            </label>
            <input
              type="text"
              value={formData.medico.servicio}
              onChange={e => updateMedico('servicio', e.target.value)}
              placeholder="Ej: Medicina Familiar"
              className={inputClass('medico.servicio')}
            />
          </div>

          {/* Número de colegiado */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Nº de colegiado
            </label>
            <input
              type="text"
              value={formData.medico.numeroColegiado}
              onChange={e => updateMedico('numeroColegiado', e.target.value)}
              placeholder="Opcional"
              className={inputClass('medico.numeroColegiado')}
            />
          </div>

          {/* Centro/Hospital */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Centro / Hospital
            </label>
            <input
              type="text"
              value={formData.medico.centro}
              onChange={e => updateMedico('centro', e.target.value)}
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
          className="flex-1 px-6 py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
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
            'Generar Interconsulta'
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
