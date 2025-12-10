'use client';

/**
 * Componente de formulario para generar interconsultas
 *
 * Incluye:
 * - Modo normal y modo consulta rápida
 * - Presets por especialidad
 * - Frases rápidas insertables
 * - Atajos de teclado
 */

import { useState, useEffect, useRef, useCallback } from 'react';
import {
  InterconsultaFormData,
  Prioridad,
  Sexo,
  ServicioDestino,
  ValidationError
} from '@/types';
import { validateInterconsultaForm, getFieldError } from '@/lib/validation';
import { getPresetByServicio, SpecialtyPreset } from '@/data/presets';
import { getFrasesPorSeccion, incrementarUsoFrase, SeccionFrase, SECCION_LABELS } from '@/lib/frasesRapidas';
import { canAutoGenerate, getQuickModeConfig, isEssentialField } from '@/lib/quickMode';
import {
  saveFormData,
  getAutosavedData,
  hasAutosavedData,
  clearAutosave,
  getAutosaveInterval,
  formatAutosaveTime,
  getAutosaveTimestamp,
} from '@/lib/autosave';

interface InterconsultaFormProps {
  initialValues?: Partial<InterconsultaFormData>;
  onGenerate: (data: InterconsultaFormData) => void;
  loading?: boolean;
  quickMode?: boolean;
  onAutoGenerate?: (data: InterconsultaFormData) => void;
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
  quickMode = false,
  onAutoGenerate,
}: InterconsultaFormProps) {
  const formRef = useRef<HTMLFormElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);
  const [formData, setFormData] = useState<InterconsultaFormData>({
    ...initialFormState,
    ...initialValues,
  });
  const [errors, setErrors] = useState<ValidationError[]>([]);
  const [servicios, setServicios] = useState<ServicioDestino[]>([]);
  const [loadingServicios, setLoadingServicios] = useState(true);
  const [currentPreset, setCurrentPreset] = useState<SpecialtyPreset | null>(null);
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [activeFrasesMenu, setActiveFrasesMenu] = useState<SeccionFrase | null>(null);

  // Autosave state
  const [lastAutosave, setLastAutosave] = useState<string | null>(null);
  const [showRestorePrompt, setShowRestorePrompt] = useState(false);

  // Check for autosaved data on mount
  useEffect(() => {
    if (hasAutosavedData('interconsulta')) {
      const timestamp = getAutosaveTimestamp('interconsulta');
      if (timestamp) {
        setShowRestorePrompt(true);
      }
    }
  }, []);

  // Autosave form data periodically
  useEffect(() => {
    const interval = setInterval(() => {
      // Only autosave if there's meaningful data
      if (formData.informacionClinica.motivoPrincipal || formData.paciente.nombre) {
        saveFormData('interconsulta', formData);
        setLastAutosave(new Date().toISOString());
      }
    }, getAutosaveInterval());

    return () => clearInterval(interval);
  }, [formData]);

  // Restore autosaved data
  const handleRestoreAutosave = () => {
    const saved = getAutosavedData<InterconsultaFormData>('interconsulta');
    if (saved) {
      setFormData(saved);
    }
    setShowRestorePrompt(false);
  };

  // Discard autosaved data
  const handleDiscardAutosave = () => {
    clearAutosave();
    setShowRestorePrompt(false);
  };

  // Load services
  useEffect(() => {
    async function loadServicios() {
      try {
        const response = await fetch('/api/servicios');
        if (response.ok) {
          const data = await response.json();
          setServicios(data.servicios || []);
        }
      } catch (error) {
        console.error('Error al cargar servicios:', error);
      } finally {
        setLoadingServicios(false);
      }
    }
    loadServicios();
  }, []);

  // Auto-focus
  useEffect(() => {
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 100);
    return () => clearTimeout(timer);
  }, []);

  // Update preset when service changes
  useEffect(() => {
    if (formData.servicioDestino) {
      const preset = getPresetByServicio(formData.servicioDestino);
      setCurrentPreset(preset || null);
    } else {
      setCurrentPreset(null);
    }
  }, [formData.servicioDestino]);

  // Auto-generate draft in quick mode
  useEffect(() => {
    if (quickMode && onAutoGenerate) {
      const config = getQuickModeConfig();
      if (canAutoGenerate(
        formData.informacionClinica.motivoPrincipal,
        formData.informacionClinica.exploracionDatosRelevantes || '',
        config
      )) {
        onAutoGenerate(formData);
      }
    }
  }, [quickMode, formData, onAutoGenerate]);

  // Keyboard shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
        e.preventDefault();
        formRef.current?.requestSubmit();
      }
      if (e.key === 'Escape') {
        if (errors.length > 0) {
          e.preventDefault();
          setErrors([]);
        }
        if (activeFrasesMenu) {
          e.preventDefault();
          setActiveFrasesMenu(null);
        }
      }
    };
    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [errors.length, activeFrasesMenu]);

  // Update functions
  const updateField = <K extends keyof InterconsultaFormData>(field: K, value: InterconsultaFormData[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setErrors(prev => prev.filter(e => !e.field.startsWith(field as string)));
  };

  const updatePaciente = <K extends keyof InterconsultaFormData['paciente']>(field: K, value: InterconsultaFormData['paciente'][K]) => {
    setFormData(prev => ({ ...prev, paciente: { ...prev.paciente, [field]: value } }));
    setErrors(prev => prev.filter(e => e.field !== `paciente.${field}`));
  };

  const updateInfoClinica = <K extends keyof InterconsultaFormData['informacionClinica']>(field: K, value: InterconsultaFormData['informacionClinica'][K]) => {
    setFormData(prev => ({ ...prev, informacionClinica: { ...prev.informacionClinica, [field]: value } }));
    setErrors(prev => prev.filter(e => e.field !== `informacionClinica.${field}`));
  };

  const updateMedico = <K extends keyof InterconsultaFormData['medico']>(field: K, value: InterconsultaFormData['medico'][K]) => {
    setFormData(prev => ({ ...prev, medico: { ...prev.medico, [field]: value } }));
    setErrors(prev => prev.filter(e => e.field !== `medico.${field}`));
  };

  // Apply preset
  const handleApplyPreset = () => {
    if (!currentPreset) return;
    if (formData.informacionClinica.motivoPrincipal.trim()) {
      setShowPresetModal(true);
    } else {
      applyPresetToForm(false);
    }
  };

  const applyPresetToForm = (append: boolean) => {
    if (!currentPreset) return;
    setFormData(prev => ({
      ...prev,
      informacionClinica: {
        ...prev.informacionClinica,
        motivoPrincipal: append ? `${prev.informacionClinica.motivoPrincipal}\n\n${currentPreset.motivoSugerido}` : currentPreset.motivoSugerido,
        antecedentesRelevantes: append && prev.informacionClinica.antecedentesRelevantes ? `${prev.informacionClinica.antecedentesRelevantes}\n\n${currentPreset.recordatorioAntecedentes}` : (prev.informacionClinica.antecedentesRelevantes || currentPreset.recordatorioAntecedentes),
        exploracionDatosRelevantes: append && prev.informacionClinica.exploracionDatosRelevantes ? `${prev.informacionClinica.exploracionDatosRelevantes}\n\n${currentPreset.recordatorioExploracion}` : (prev.informacionClinica.exploracionDatosRelevantes || currentPreset.recordatorioExploracion),
      },
    }));
    setShowPresetModal(false);
  };

  // Insert quick phrase
  const handleInsertFrase = useCallback((seccion: SeccionFrase, fraseId: string, texto: string) => {
    incrementarUsoFrase(fraseId);
    const fieldMap: Record<SeccionFrase, keyof InterconsultaFormData['informacionClinica']> = {
      motivo: 'motivoPrincipal',
      antecedentes: 'antecedentesRelevantes',
      exploracion: 'exploracionDatosRelevantes',
      presuncion: 'presuncionDiagnostica',
      tratamiento: 'tratamientoActual',
    };
    const field = fieldMap[seccion];
    const currentValue = formData.informacionClinica[field] || '';
    const newValue = currentValue ? `${currentValue}\n${texto}` : texto;
    updateInfoClinica(field, newValue);
    setActiveFrasesMenu(null);
  }, [formData.informacionClinica]);

  // Submit
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const validation = validateInterconsultaForm(formData);
    if (!validation.isValid) {
      setErrors(validation.errors);
      const firstErrorField = document.querySelector('[data-has-error="true"]');
      firstErrorField?.scrollIntoView({ behavior: 'smooth', block: 'center' });
      return;
    }
    setErrors([]);
    onGenerate(formData);
  };

  // Clear form
  const handleClear = () => {
    setFormData(initialFormState);
    setErrors([]);
    setCurrentPreset(null);
    firstInputRef.current?.focus();
  };

  const renderError = (field: string) => {
    const error = getFieldError(errors, field);
    if (!error) return null;
    return <p className="mt-1 text-sm text-red-600 dark:text-red-400">{error}</p>;
  };

  const inputClass = (field: string) =>
    `w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-colors dark:bg-gray-800 dark:text-gray-100 ${
      getFieldError(errors, field) ? 'border-red-500 bg-red-50 dark:bg-red-900/20 dark:border-red-500' : 'border-gray-300 dark:border-gray-600'
    }`;

  // Frases cache (loaded client-side only to avoid hydration mismatch)
  const [frasesCache, setFrasesCache] = useState<Record<SeccionFrase, ReturnType<typeof getFrasesPorSeccion>>>({
    motivo: [],
    antecedentes: [],
    exploracion: [],
    presuncion: [],
    tratamiento: [],
  });

  // Load frases on mount (client-side only)
  useEffect(() => {
    setFrasesCache({
      motivo: getFrasesPorSeccion('motivo'),
      antecedentes: getFrasesPorSeccion('antecedentes'),
      exploracion: getFrasesPorSeccion('exploracion'),
      presuncion: getFrasesPorSeccion('presuncion'),
      tratamiento: getFrasesPorSeccion('tratamiento'),
    });
  }, []);

  // Quick Phrases Button
  const QuickPhrasesButton = ({ seccion }: { seccion: SeccionFrase }) => {
    const frases = frasesCache[seccion];
    const isOpen = activeFrasesMenu === seccion;
    if (frases.length === 0) return null;

    return (
      <div className="relative inline-block">
        <button
          type="button"
          onClick={() => setActiveFrasesMenu(isOpen ? null : seccion)}
          className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 flex items-center gap-1"
          title="Insertar frase rapida"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
          </svg>
          Frases
        </button>
        {isOpen && (
          <div className="absolute left-0 top-full mt-1 w-64 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-20 max-h-48 overflow-y-auto">
            <div className="p-2 border-b border-gray-100 dark:border-gray-700">
              <p className="text-xs font-medium text-gray-500 dark:text-gray-400">{SECCION_LABELS[seccion]}</p>
            </div>
            <div className="p-1">
              {frases.map(frase => (
                <button
                  key={frase.id}
                  type="button"
                  onClick={() => handleInsertFrase(seccion, frase.id, frase.texto)}
                  className="w-full text-left px-2 py-1.5 text-xs rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <span className="font-medium text-gray-700 dark:text-gray-300">{frase.etiqueta}</span>
                  <p className="text-gray-500 dark:text-gray-400 truncate">{frase.texto.substring(0, 50)}...</p>
                </button>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  };

  const shouldShowField = (fieldPath: string) => {
    if (!quickMode) return true;
    return isEssentialField(fieldPath);
  };

  return (
    <>
      {/* Autosave restore prompt */}
      {showRestorePrompt && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded-lg">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-start gap-2">
              <svg className="h-5 w-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <div>
                <p className="text-sm font-medium text-blue-800 dark:text-blue-200">
                  Hay un borrador guardado automaticamente
                </p>
                <p className="text-xs text-blue-600 dark:text-blue-400 mt-0.5">
                  {formatAutosaveTime(getAutosaveTimestamp('interconsulta') || '')}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleRestoreAutosave}
                className="px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition-colors"
              >
                Restaurar
              </button>
              <button
                type="button"
                onClick={handleDiscardAutosave}
                className="px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-100 dark:hover:bg-blue-800/50 rounded transition-colors"
              >
                Descartar
              </button>
            </div>
          </div>
        </div>
      )}

      <form ref={formRef} onSubmit={handleSubmit} className="space-y-4 sm:space-y-6">
        {/* Autosave indicator */}
        {lastAutosave && (
          <div className="flex items-center justify-end gap-1.5 text-xs text-gray-400 dark:text-gray-500">
            <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
            </svg>
            <span>Autoguardado {formatAutosaveTime(lastAutosave)}</span>
          </div>
        )}

        {/* Error summary */}
        {errors.length > 0 && (
          <div className="p-3 sm:p-4 bg-red-50 dark:bg-red-900/30 border border-red-200 dark:border-red-800 rounded-lg">
            <div className="flex justify-between items-start">
              <p className="text-red-800 dark:text-red-300 font-medium text-sm">Por favor, corrija los siguientes errores:</p>
              <button type="button" onClick={() => setErrors([])} className="text-red-600 dark:text-red-400 hover:text-red-800 text-xs" title="Cerrar (Esc)">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
              </button>
            </div>
            <ul className="mt-2 list-disc list-inside text-red-700 dark:text-red-400 text-xs sm:text-sm">
              {errors.map((error, index) => (<li key={index}>{error.message}</li>))}
            </ul>
          </div>
        )}

        {/* General Data */}
        <fieldset className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <legend className="px-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Datos Generales</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
            <div data-has-error={!!getFieldError(errors, 'servicioDestino')}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servicio destino <span className="text-red-500">*</span></label>
              <select value={formData.servicioDestino} onChange={e => updateField('servicioDestino', e.target.value)} className={inputClass('servicioDestino')} disabled={loadingServicios}>
                {loadingServicios ? (<option value="">Cargando...</option>) : (<><option value="">Seleccione...</option>{servicios.map(s => (<option key={s.id} value={s.nombre}>{s.nombre}</option>))}</>)}
              </select>
              {renderError('servicioDestino')}
              {currentPreset && (
                <button type="button" onClick={handleApplyPreset} className="mt-2 text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 flex items-center gap-1">
                  <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
                  Usar plantilla de {currentPreset.servicio}
                </button>
              )}
              {!currentPreset && formData.servicioDestino && (<p className="mt-1 text-xs text-gray-400 dark:text-gray-500">No hay plantilla para este servicio. Puedes crear una en Configuración.</p>)}
            </div>
            <div data-has-error={!!getFieldError(errors, 'prioridad')}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Prioridad <span className="text-red-500">*</span></label>
              <select value={formData.prioridad} onChange={e => updateField('prioridad', e.target.value as Prioridad)} className={inputClass('prioridad')}>
                {prioridades.map(p => (<option key={p} value={p}>{p}</option>))}
              </select>
              {renderError('prioridad')}
            </div>
            {shouldShowField('servicioRemitente') && (
              <div className="sm:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servicio remitente</label>
                <input type="text" value={formData.servicioRemitente} onChange={e => updateField('servicioRemitente', e.target.value)} placeholder="Ej: Atención Primaria, Urgencias..." className={inputClass('servicioRemitente')} />
              </div>
            )}
          </div>
        </fieldset>

        {/* Patient Data */}
        <fieldset className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <legend className="px-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Datos del Paciente</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
            <div data-has-error={!!getFieldError(errors, 'paciente.nombre')}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre / Iniciales <span className="text-red-500">*</span></label>
              <input ref={firstInputRef} type="text" value={formData.paciente.nombre} onChange={e => updatePaciente('nombre', e.target.value)} placeholder="Ej: J.G.M." className={inputClass('paciente.nombre')} />
              {renderError('paciente.nombre')}
            </div>
            <div data-has-error={!!getFieldError(errors, 'paciente.edad')}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Edad (años) <span className="text-red-500">*</span></label>
              <input type="number" min="0" max="150" value={formData.paciente.edad || ''} onChange={e => updatePaciente('edad', parseInt(e.target.value) || 0)} placeholder="65" className={inputClass('paciente.edad')} />
              {renderError('paciente.edad')}
            </div>
            {shouldShowField('paciente.sexo') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Sexo</label>
                <select value={formData.paciente.sexo} onChange={e => updatePaciente('sexo', e.target.value as Sexo)} className={inputClass('paciente.sexo')}>
                  {sexos.map(s => (<option key={s} value={s}>{s}</option>))}
                </select>
              </div>
            )}
            {shouldShowField('paciente.identificador') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">ID / Historia Clínica</label>
                <input type="text" value={formData.paciente.identificador} onChange={e => updatePaciente('identificador', e.target.value)} placeholder="Opcional" className={inputClass('paciente.identificador')} />
              </div>
            )}
          </div>
        </fieldset>

        {/* Clinical Info */}
        <fieldset className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <legend className="px-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Información Clínica</legend>
          <div className="space-y-3 sm:space-y-4 mt-3">
            <div data-has-error={!!getFieldError(errors, 'informacionClinica.motivoPrincipal')}>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Motivo principal <span className="text-red-500">*</span></label>
                <QuickPhrasesButton seccion="motivo" />
              </div>
              <textarea value={formData.informacionClinica.motivoPrincipal} onChange={e => updateInfoClinica('motivoPrincipal', e.target.value)} rows={quickMode ? 2 : 3} placeholder="Describa el motivo principal..." className={inputClass('informacionClinica.motivoPrincipal')} />
              {renderError('informacionClinica.motivoPrincipal')}
            </div>
            {shouldShowField('informacionClinica.antecedentesRelevantes') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Antecedentes relevantes</label>
                  <QuickPhrasesButton seccion="antecedentes" />
                </div>
                <textarea value={formData.informacionClinica.antecedentesRelevantes} onChange={e => updateInfoClinica('antecedentesRelevantes', e.target.value)} rows={2} placeholder="Antecedentes médicos relevantes..." className={inputClass('informacionClinica.antecedentesRelevantes')} />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Exploración / Datos relevantes</label>
                <QuickPhrasesButton seccion="exploracion" />
              </div>
              <textarea value={formData.informacionClinica.exploracionDatosRelevantes} onChange={e => updateInfoClinica('exploracionDatosRelevantes', e.target.value)} rows={quickMode ? 2 : 3} placeholder="Hallazgos de exploración..." className={inputClass('informacionClinica.exploracionDatosRelevantes')} />
            </div>
            {shouldShowField('informacionClinica.presuncionDiagnostica') && (
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Presunción diagnóstica</label>
                  <QuickPhrasesButton seccion="presuncion" />
                </div>
                <textarea value={formData.informacionClinica.presuncionDiagnostica} onChange={e => updateInfoClinica('presuncionDiagnostica', e.target.value)} rows={2} placeholder="Diagnóstico de sospecha..." className={inputClass('informacionClinica.presuncionDiagnostica')} />
              </div>
            )}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">Tratamiento actual relevante</label>
                <QuickPhrasesButton seccion="tratamiento" />
              </div>
              <textarea value={formData.informacionClinica.tratamientoActual} onChange={e => updateInfoClinica('tratamientoActual', e.target.value)} rows={2} placeholder="Medicación actual relevante..." className={inputClass('informacionClinica.tratamientoActual')} />
            </div>
          </div>
        </fieldset>

        {/* Doctor Data */}
        <fieldset className="p-3 sm:p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
          <legend className="px-2 text-base sm:text-lg font-semibold text-gray-900 dark:text-gray-100">Médico Remitente</legend>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4 mt-3">
            <div data-has-error={!!getFieldError(errors, 'medico.nombre')}>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nombre <span className="text-red-500">*</span></label>
              <input type="text" value={formData.medico.nombre} onChange={e => updateMedico('nombre', e.target.value)} placeholder="Dr./Dra. Nombre" className={inputClass('medico.nombre')} />
              {renderError('medico.nombre')}
            </div>
            {shouldShowField('medico.servicio') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Servicio</label>
                <input type="text" value={formData.medico.servicio} onChange={e => updateMedico('servicio', e.target.value)} placeholder="Ej: Medicina Familiar" className={inputClass('medico.servicio')} />
              </div>
            )}
            {shouldShowField('medico.numeroColegiado') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Nº de colegiado</label>
                <input type="text" value={formData.medico.numeroColegiado} onChange={e => updateMedico('numeroColegiado', e.target.value)} placeholder="Opcional" className={inputClass('medico.numeroColegiado')} />
              </div>
            )}
            {shouldShowField('medico.centro') && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Centro / Hospital</label>
                <input type="text" value={formData.medico.centro} onChange={e => updateMedico('centro', e.target.value)} placeholder="Ej: Hospital Universitario..." className={inputClass('medico.centro')} />
              </div>
            )}
          </div>
        </fieldset>

        {/* Action buttons */}
        <div className="flex flex-col sm:flex-row gap-2 sm:gap-3">
          <button type="submit" disabled={loading} className="flex-1 px-4 sm:px-6 py-2.5 sm:py-3 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 dark:focus:ring-blue-800 transition-colors disabled:opacity-50 disabled:cursor-not-allowed text-sm sm:text-base">
            {loading ? (
              <span className="flex items-center justify-center gap-2">
                <svg className="animate-spin h-4 w-4 sm:h-5 sm:w-5" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" /></svg>
                Generando...
              </span>
            ) : (
              <span className="flex items-center justify-center gap-2">
                Generar Interconsulta
                <kbd className="hidden sm:inline px-1.5 py-0.5 text-xs bg-blue-700 rounded">Ctrl+Enter</kbd>
              </span>
            )}
          </button>
          <button type="button" onClick={handleClear} disabled={loading} className="px-4 sm:px-6 py-2.5 sm:py-3 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 font-medium rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors disabled:opacity-50 text-sm sm:text-base">
            Limpiar
          </button>
        </div>
      </form>

      {/* Preset confirmation modal */}
      {showPresetModal && currentPreset && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-xl max-w-md w-full p-6">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Aplicar plantilla de {currentPreset.servicio}</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Ya hay texto en algunos campos. ¿Cómo desea aplicar la plantilla?</p>
            <div className="flex flex-col gap-2">
              <button onClick={() => applyPresetToForm(true)} className="w-full px-4 py-2 text-sm font-medium bg-blue-600 text-white rounded-lg hover:bg-blue-700">Añadir al final del texto existente</button>
              <button onClick={() => applyPresetToForm(false)} className="w-full px-4 py-2 text-sm font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600">Reemplazar solo campos vacíos</button>
              <button onClick={() => setShowPresetModal(false)} className="w-full px-4 py-2 text-sm font-medium text-gray-500 dark:text-gray-400 hover:text-gray-700">Cancelar</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
