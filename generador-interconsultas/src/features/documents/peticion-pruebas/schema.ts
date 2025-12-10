/**
 * Schema y tipos para Petición de Pruebas Diagnósticas
 *
 * Define la estructura de datos, validación y plantilla por defecto
 * para solicitar pruebas de laboratorio, imagen u otras.
 */

import { z } from 'zod';
import { pacienteSchema, medicoSchema, prioridadSchema, PlaceholderInfo } from '../base/types';

// =============================================================================
// SCHEMA
// =============================================================================

export const peticionPruebasSchema = z.object({
  tipoDocumento: z.literal('peticion-pruebas'),

  // Datos del paciente
  paciente: pacienteSchema,

  // Datos clínicos
  clinico: z.object({
    diagnosticoPrincipal: z.string().min(1, 'Diagnóstico principal requerido'),
    diagnosticosSecundarios: z.string().optional(),
    situacionClinica: z.string().optional(),
    informacionRelevante: z.string().optional(),
  }),

  // Pruebas solicitadas
  pruebas: z.object({
    tipo: z.enum(['Laboratorio', 'Imagen', 'Funcionales', 'Otras']),
    listaPruebas: z.string().min(1, 'Debe especificar al menos una prueba'),
    justificacion: z.string().min(1, 'Justificación clínica requerida'),
    urgente: z.boolean().default(false),
    preparacionEspecial: z.string().optional(),
  }),

  // Contexto de la solicitud
  solicitud: z.object({
    servicioSolicitante: z.string().min(1, 'Servicio solicitante requerido'),
    servicioDestino: z.string().optional(),
    prioridad: prioridadSchema,
    observaciones: z.string().optional(),
  }),

  // Médico solicitante
  medico: medicoSchema,
});

export type PeticionPruebasFormData = z.infer<typeof peticionPruebasSchema>;

// =============================================================================
// VALORES INICIALES
// =============================================================================

export const peticionPruebasInitialValues: PeticionPruebasFormData = {
  tipoDocumento: 'peticion-pruebas',
  paciente: {
    nombre: '',
    edad: 0,
    sexo: 'No especificado',
    identificador: '',
  },
  clinico: {
    diagnosticoPrincipal: '',
    diagnosticosSecundarios: '',
    situacionClinica: '',
    informacionRelevante: '',
  },
  pruebas: {
    tipo: 'Laboratorio',
    listaPruebas: '',
    justificacion: '',
    urgente: false,
    preparacionEspecial: '',
  },
  solicitud: {
    servicioSolicitante: '',
    servicioDestino: '',
    prioridad: 'Normal',
    observaciones: '',
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

export const peticionPruebasPlaceholders: PlaceholderInfo[] = [
  // Paciente
  { key: 'paciente_nombre', label: 'Nombre del paciente', description: 'Nombre o iniciales', required: true, section: 'Paciente' },
  { key: 'paciente_edad', label: 'Edad', description: 'Edad en años', required: true, section: 'Paciente' },
  { key: 'paciente_sexo', label: 'Sexo', description: 'Masculino/Femenino', required: true, section: 'Paciente' },
  { key: 'paciente_identificador', label: 'NHC', description: 'Número de historia clínica', required: false, section: 'Paciente' },

  // Clínico
  { key: 'diagnostico_principal', label: 'Diagnóstico principal', description: 'Diagnóstico que motiva la petición', required: true, section: 'Clínico' },
  { key: 'diagnosticos_secundarios', label: 'Diagnósticos secundarios', description: 'Otros diagnósticos relevantes', required: false, section: 'Clínico' },
  { key: 'situacion_clinica', label: 'Situación clínica', description: 'Estado actual del paciente', required: false, section: 'Clínico' },
  { key: 'informacion_relevante', label: 'Información relevante', description: 'Alergias, contraindicaciones, etc.', required: false, section: 'Clínico' },

  // Pruebas
  { key: 'tipo_pruebas', label: 'Tipo de pruebas', description: 'Laboratorio, Imagen, etc.', required: true, section: 'Pruebas' },
  { key: 'lista_pruebas', label: 'Pruebas solicitadas', description: 'Detalle de pruebas', required: true, section: 'Pruebas' },
  { key: 'justificacion', label: 'Justificación clínica', description: 'Motivo de la solicitud', required: true, section: 'Pruebas' },
  { key: 'preparacion_especial', label: 'Preparación especial', description: 'Ayuno, suspender medicación, etc.', required: false, section: 'Pruebas' },

  // Solicitud
  { key: 'servicio_solicitante', label: 'Servicio solicitante', description: 'Servicio que solicita', required: true, section: 'Solicitud' },
  { key: 'servicio_destino', label: 'Servicio destino', description: 'Laboratorio o servicio de imagen', required: false, section: 'Solicitud' },
  { key: 'prioridad', label: 'Prioridad', description: 'Urgente, Preferente o Normal', required: true, section: 'Solicitud' },
  { key: 'observaciones', label: 'Observaciones', description: 'Notas adicionales', required: false, section: 'Solicitud' },

  // Médico
  { key: 'medico_nombre', label: 'Médico solicitante', description: 'Nombre del médico', required: true, section: 'Médico' },
  { key: 'medico_colegiado', label: 'Nº Colegiado', description: 'Número de colegiado', required: false, section: 'Médico' },
  { key: 'medico_centro', label: 'Centro', description: 'Hospital o centro médico', required: false, section: 'Médico' },
];

// =============================================================================
// PLANTILLA POR DEFECTO
// =============================================================================

export const peticionPruebasDefaultTemplate = `PETICIÓN DE PRUEBAS DIAGNÓSTICAS
================================

DATOS DEL PACIENTE
------------------
Paciente: {{paciente_nombre}}
Edad: {{paciente_edad}} años
Sexo: {{paciente_sexo}}
{{#paciente_identificador}}NHC: {{paciente_identificador}}{{/paciente_identificador}}

INFORMACIÓN CLÍNICA
-------------------
Diagnóstico principal: {{diagnostico_principal}}
{{#diagnosticos_secundarios}}Diagnósticos secundarios: {{diagnosticos_secundarios}}{{/diagnosticos_secundarios}}
{{#situacion_clinica}}Situación clínica actual: {{situacion_clinica}}{{/situacion_clinica}}
{{#informacion_relevante}}Información relevante: {{informacion_relevante}}{{/informacion_relevante}}

PRUEBAS SOLICITADAS
-------------------
Tipo: {{tipo_pruebas}}
Prioridad: {{prioridad}}

{{lista_pruebas}}

JUSTIFICACIÓN CLÍNICA
---------------------
{{justificacion}}

{{#preparacion_especial}}PREPARACIÓN ESPECIAL
--------------------
{{preparacion_especial}}
{{/preparacion_especial}}

{{#observaciones}}OBSERVACIONES
-------------
{{observaciones}}
{{/observaciones}}

DATOS DE LA SOLICITUD
---------------------
Servicio solicitante: {{servicio_solicitante}}
{{#servicio_destino}}Servicio destino: {{servicio_destino}}{{/servicio_destino}}
Médico solicitante: {{medico_nombre}}
{{#medico_colegiado}}Nº Colegiado: {{medico_colegiado}}{{/medico_colegiado}}
{{#medico_centro}}Centro: {{medico_centro}}{{/medico_centro}}

Fecha: {{fecha}}
`;

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Convierte los datos del formulario en variables planas para la plantilla
 */
export function flattenPeticionPruebasData(
  data: PeticionPruebasFormData
): Record<string, string> {
  const hoy = new Date();
  const fecha = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth() + 1).toString().padStart(2, '0')}/${hoy.getFullYear()}`;

  return {
    // Paciente
    paciente_nombre: data.paciente.nombre,
    paciente_edad: data.paciente.edad.toString(),
    paciente_sexo: data.paciente.sexo,
    paciente_identificador: data.paciente.identificador || '',

    // Clínico
    diagnostico_principal: data.clinico.diagnosticoPrincipal,
    diagnosticos_secundarios: data.clinico.diagnosticosSecundarios || '',
    situacion_clinica: data.clinico.situacionClinica || '',
    informacion_relevante: data.clinico.informacionRelevante || '',

    // Pruebas
    tipo_pruebas: data.pruebas.tipo,
    lista_pruebas: data.pruebas.listaPruebas,
    justificacion: data.pruebas.justificacion,
    preparacion_especial: data.pruebas.preparacionEspecial || '',

    // Solicitud
    servicio_solicitante: data.solicitud.servicioSolicitante,
    servicio_destino: data.solicitud.servicioDestino || '',
    prioridad: `${data.solicitud.prioridad}${data.pruebas.urgente ? ' (URGENTE)' : ''}`,
    observaciones: data.solicitud.observaciones || '',

    // Médico
    medico_nombre: data.medico.nombre,
    medico_servicio: data.medico.servicio || '',
    medico_colegiado: data.medico.numeroColegiado || '',
    medico_centro: data.medico.centro || '',

    // Fecha
    fecha,
  };
}

// Tipos de pruebas comunes para sugerencias
export const TIPOS_PRUEBAS_LABORATORIO = [
  'Hemograma completo',
  'Bioquímica básica (glucosa, creatinina, urea)',
  'Perfil lipídico',
  'Función hepática (GOT, GPT, GGT, bilirrubina)',
  'Coagulación (TP, TTPa, fibrinógeno)',
  'Marcadores cardíacos (troponina, BNP)',
  'Función tiroidea (TSH, T4L)',
  'PCR y VSG',
  'Hemoglobina glicosilada (HbA1c)',
  'Sedimento urinario',
  'Cultivo y antibiograma',
];

export const TIPOS_PRUEBAS_IMAGEN = [
  'Radiografía de tórax',
  'Radiografía de abdomen',
  'Ecografía abdominal',
  'Ecografía Doppler',
  'TAC craneal',
  'TAC tórax',
  'TAC abdominal',
  'Resonancia magnética',
  'Ecocardiograma',
  'Mamografía',
];

export const TIPOS_PRUEBAS_FUNCIONALES = [
  'Electrocardiograma (ECG)',
  'Holter 24h',
  'MAPA (Monitorización ambulatoria de presión arterial)',
  'Espirometría',
  'Prueba de esfuerzo',
  'Electroencefalograma (EEG)',
  'Electromiografía (EMG)',
  'Polisomnografía',
];
