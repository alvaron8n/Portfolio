/**
 * Schema y tipos para Nota Evolutiva (Formato SOAP)
 *
 * Define la estructura de datos para notas de evolución clínica
 * siguiendo el formato SOAP (Subjetivo, Objetivo, Análisis, Plan).
 */

import { z } from 'zod';
import { pacienteSchema, medicoSchema, PlaceholderInfo } from '../base/types';

// =============================================================================
// SCHEMA
// =============================================================================

export const notaEvolutivaSchema = z.object({
  tipoDocumento: z.literal('nota-evolutiva'),

  // Datos del paciente
  paciente: pacienteSchema,

  // Contexto de la nota
  contexto: z.object({
    fechaNota: z.string().min(1, 'Fecha requerida'),
    servicio: z.string().min(1, 'Servicio requerido'),
    numeroNota: z.string().optional(), // Nota evolutiva #X
    diasIngreso: z.number().optional(),
    diagnosticoPrincipal: z.string().min(1, 'Diagnóstico principal requerido'),
  }),

  // SOAP - Subjetivo
  subjetivo: z.object({
    sintomas: z.string().optional(), // Lo que refiere el paciente
    evolucion: z.string().optional(), // Cómo se siente respecto a antes
    tolerancia: z.string().optional(), // Tolerancia oral, dolor, etc.
    otrasQuejas: z.string().optional(),
  }),

  // SOAP - Objetivo
  objetivo: z.object({
    estadoGeneral: z.string().optional(),
    constantesVitales: z.string().optional(), // TA, FC, FR, Tª, SatO2
    exploracionFisica: z.string().optional(),
    pruebasRecientes: z.string().optional(), // Resultados de analíticas, etc.
  }),

  // SOAP - Análisis/Valoración
  analisis: z.object({
    impresionClinica: z.string().min(1, 'Valoración clínica requerida'),
    problemasActivos: z.string().optional(),
    evolucionGeneral: z.enum(['Favorable', 'Estable', 'Desfavorable', 'Crítica']),
  }),

  // SOAP - Plan
  plan: z.object({
    tratamientoActual: z.string().optional(),
    cambiosTratamiento: z.string().optional(),
    pruebasPendientes: z.string().optional(),
    interconsultas: z.string().optional(),
    objetivosCortoPlaza: z.string().optional(),
    previsionAlta: z.string().optional(),
  }),

  // Médico responsable
  medico: medicoSchema,
});

export type NotaEvolutivaFormData = z.infer<typeof notaEvolutivaSchema>;

// =============================================================================
// VALORES INICIALES
// =============================================================================

export const notaEvolutivaInitialValues: NotaEvolutivaFormData = {
  tipoDocumento: 'nota-evolutiva',
  paciente: {
    nombre: '',
    edad: 0,
    sexo: 'No especificado',
    identificador: '',
  },
  contexto: {
    fechaNota: new Date().toISOString().split('T')[0],
    servicio: '',
    numeroNota: '',
    diasIngreso: undefined,
    diagnosticoPrincipal: '',
  },
  subjetivo: {
    sintomas: '',
    evolucion: '',
    tolerancia: '',
    otrasQuejas: '',
  },
  objetivo: {
    estadoGeneral: '',
    constantesVitales: '',
    exploracionFisica: '',
    pruebasRecientes: '',
  },
  analisis: {
    impresionClinica: '',
    problemasActivos: '',
    evolucionGeneral: 'Estable',
  },
  plan: {
    tratamientoActual: '',
    cambiosTratamiento: '',
    pruebasPendientes: '',
    interconsultas: '',
    objetivosCortoPlaza: '',
    previsionAlta: '',
  },
  medico: {
    nombre: '',
    servicio: '',
    numeroColegiado: '',
    centro: '',
  },
};

// =============================================================================
// PLACEHOLDERS
// =============================================================================

export const notaEvolutivaPlaceholders: PlaceholderInfo[] = [
  // Paciente
  { key: 'paciente_nombre', label: 'Nombre del paciente', description: 'Nombre o iniciales', required: true, section: 'Paciente' },
  { key: 'paciente_edad', label: 'Edad', description: 'Edad en años', required: true, section: 'Paciente' },
  { key: 'paciente_sexo', label: 'Sexo', description: 'Masculino/Femenino', required: true, section: 'Paciente' },
  { key: 'paciente_identificador', label: 'NHC', description: 'Número de historia clínica', required: false, section: 'Paciente' },

  // Contexto
  { key: 'fecha_nota', label: 'Fecha', description: 'Fecha de la nota', required: true, section: 'Contexto' },
  { key: 'servicio', label: 'Servicio', description: 'Servicio clínico', required: true, section: 'Contexto' },
  { key: 'numero_nota', label: 'Número de nota', description: 'Nota evolutiva #', required: false, section: 'Contexto' },
  { key: 'dias_ingreso', label: 'Días de ingreso', description: 'Días desde el ingreso', required: false, section: 'Contexto' },
  { key: 'diagnostico_principal', label: 'Diagnóstico principal', description: 'Diagnóstico de ingreso', required: true, section: 'Contexto' },

  // Subjetivo
  { key: 'sintomas', label: 'Síntomas', description: 'Lo que refiere el paciente', required: false, section: 'Subjetivo' },
  { key: 'evolucion', label: 'Evolución', description: 'Cómo se siente respecto a antes', required: false, section: 'Subjetivo' },
  { key: 'tolerancia', label: 'Tolerancia', description: 'Tolerancia oral, dolor, etc.', required: false, section: 'Subjetivo' },

  // Objetivo
  { key: 'estado_general', label: 'Estado general', description: 'Aspecto general del paciente', required: false, section: 'Objetivo' },
  { key: 'constantes_vitales', label: 'Constantes vitales', description: 'TA, FC, FR, Tª, SatO2', required: false, section: 'Objetivo' },
  { key: 'exploracion_fisica', label: 'Exploración física', description: 'Hallazgos relevantes', required: false, section: 'Objetivo' },
  { key: 'pruebas_recientes', label: 'Pruebas recientes', description: 'Resultados de analíticas', required: false, section: 'Objetivo' },

  // Análisis
  { key: 'impresion_clinica', label: 'Impresión clínica', description: 'Valoración médica', required: true, section: 'Análisis' },
  { key: 'problemas_activos', label: 'Problemas activos', description: 'Lista de problemas', required: false, section: 'Análisis' },
  { key: 'evolucion_general', label: 'Evolución general', description: 'Favorable/Estable/Desfavorable', required: true, section: 'Análisis' },

  // Plan
  { key: 'tratamiento_actual', label: 'Tratamiento actual', description: 'Medicación vigente', required: false, section: 'Plan' },
  { key: 'cambios_tratamiento', label: 'Cambios', description: 'Modificaciones al tratamiento', required: false, section: 'Plan' },
  { key: 'pruebas_pendientes', label: 'Pruebas pendientes', description: 'Estudios solicitados', required: false, section: 'Plan' },
  { key: 'prevision_alta', label: 'Previsión de alta', description: 'Estimación de alta', required: false, section: 'Plan' },

  // Médico
  { key: 'medico_nombre', label: 'Médico', description: 'Nombre del médico', required: true, section: 'Médico' },
];

// =============================================================================
// PLANTILLA POR DEFECTO
// =============================================================================

export const notaEvolutivaDefaultTemplate = `NOTA EVOLUTIVA
==============
{{#numero_nota}}Nota Evolutiva {{numero_nota}}{{/numero_nota}}
Fecha: {{fecha_nota}}

DATOS DEL PACIENTE
------------------
Paciente: {{paciente_nombre}}
Edad: {{paciente_edad}} años | Sexo: {{paciente_sexo}}
{{#paciente_identificador}}NHC: {{paciente_identificador}}{{/paciente_identificador}}
Servicio: {{servicio}}
{{#dias_ingreso}}Días de ingreso: {{dias_ingreso}}{{/dias_ingreso}}
Diagnóstico principal: {{diagnostico_principal}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

S - SUBJETIVO (Lo que refiere el paciente)
------------------------------------------
{{#sintomas}}Síntomas: {{sintomas}}{{/sintomas}}
{{#evolucion}}Evolución: {{evolucion}}{{/evolucion}}
{{#tolerancia}}Tolerancia: {{tolerancia}}{{/tolerancia}}
{{#otras_quejas}}Otras: {{otras_quejas}}{{/otras_quejas}}

O - OBJETIVO (Hallazgos clínicos)
---------------------------------
{{#estado_general}}Estado general: {{estado_general}}{{/estado_general}}
{{#constantes_vitales}}Constantes: {{constantes_vitales}}{{/constantes_vitales}}
{{#exploracion_fisica}}Exploración: {{exploracion_fisica}}{{/exploracion_fisica}}
{{#pruebas_recientes}}Pruebas: {{pruebas_recientes}}{{/pruebas_recientes}}

A - ANÁLISIS (Valoración clínica)
---------------------------------
Evolución: {{evolucion_general}}
Impresión clínica: {{impresion_clinica}}
{{#problemas_activos}}Problemas activos: {{problemas_activos}}{{/problemas_activos}}

P - PLAN (Actuación)
--------------------
{{#tratamiento_actual}}Tratamiento actual: {{tratamiento_actual}}{{/tratamiento_actual}}
{{#cambios_tratamiento}}Cambios: {{cambios_tratamiento}}{{/cambios_tratamiento}}
{{#pruebas_pendientes}}Pruebas pendientes: {{pruebas_pendientes}}{{/pruebas_pendientes}}
{{#interconsultas}}Interconsultas: {{interconsultas}}{{/interconsultas}}
{{#objetivos_corto_plazo}}Objetivos: {{objetivos_corto_plazo}}{{/objetivos_corto_plazo}}
{{#prevision_alta}}Previsión de alta: {{prevision_alta}}{{/prevision_alta}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Médico responsable: {{medico_nombre}}
{{#medico_colegiado}}Nº Colegiado: {{medico_colegiado}}{{/medico_colegiado}}
{{#medico_centro}}Centro: {{medico_centro}}{{/medico_centro}}
`;

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Convierte los datos del formulario en variables planas para la plantilla
 */
export function flattenNotaEvolutivaData(
  data: NotaEvolutivaFormData
): Record<string, string> {
  // Formatear fecha
  const fechaParts = data.contexto.fechaNota.split('-');
  const fechaFormateada = fechaParts.length === 3
    ? `${fechaParts[2]}/${fechaParts[1]}/${fechaParts[0]}`
    : data.contexto.fechaNota;

  return {
    // Paciente
    paciente_nombre: data.paciente.nombre,
    paciente_edad: data.paciente.edad.toString(),
    paciente_sexo: data.paciente.sexo,
    paciente_identificador: data.paciente.identificador || '',

    // Contexto
    fecha_nota: fechaFormateada,
    servicio: data.contexto.servicio,
    numero_nota: data.contexto.numeroNota || '',
    dias_ingreso: data.contexto.diasIngreso?.toString() || '',
    diagnostico_principal: data.contexto.diagnosticoPrincipal,

    // Subjetivo
    sintomas: data.subjetivo.sintomas || '',
    evolucion: data.subjetivo.evolucion || '',
    tolerancia: data.subjetivo.tolerancia || '',
    otras_quejas: data.subjetivo.otrasQuejas || '',

    // Objetivo
    estado_general: data.objetivo.estadoGeneral || '',
    constantes_vitales: data.objetivo.constantesVitales || '',
    exploracion_fisica: data.objetivo.exploracionFisica || '',
    pruebas_recientes: data.objetivo.pruebasRecientes || '',

    // Análisis
    impresion_clinica: data.analisis.impresionClinica,
    problemas_activos: data.analisis.problemasActivos || '',
    evolucion_general: data.analisis.evolucionGeneral,

    // Plan
    tratamiento_actual: data.plan.tratamientoActual || '',
    cambios_tratamiento: data.plan.cambiosTratamiento || '',
    pruebas_pendientes: data.plan.pruebasPendientes || '',
    interconsultas: data.plan.interconsultas || '',
    objetivos_corto_plazo: data.plan.objetivosCortoPlaza || '',
    prevision_alta: data.plan.previsionAlta || '',

    // Médico
    medico_nombre: data.medico.nombre,
    medico_servicio: data.medico.servicio || '',
    medico_colegiado: data.medico.numeroColegiado || '',
    medico_centro: data.medico.centro || '',
  };
}

// Estados comunes para sugerencias
export const ESTADOS_GENERALES = [
  'Buen estado general',
  'Regular estado general',
  'Mal estado general',
  'Consciente, orientado, colaborador',
  'Eupneico en reposo',
  'Afebril',
  'Normocoloreado, normohidratado',
];

export const CONSTANTES_EJEMPLO = 'TA: 120/80 mmHg | FC: 75 lpm | FR: 16 rpm | Tª: 36.5°C | SatO2: 98%';
