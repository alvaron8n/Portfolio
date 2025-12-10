/**
 * Schema y tipos para Informe de Alta Hospitalaria
 *
 * Un informe de alta incluye:
 * - Datos del paciente
 * - Datos del episodio (fechas, servicio)
 * - Diagnósticos
 * - Procedimientos realizados
 * - Evolución
 * - Tratamiento y recomendaciones al alta
 * - Signos de alarma
 * - Citas de seguimiento
 */

import { z } from 'zod';
import {
  pacienteSchema,
  medicoSchema,
  formatearFechaActual,
  formatDateForInput,
  calcularDiasEntre,
  type DocumentTypeConfig,
  type PlaceholderInfo,
} from '../base/types';

// =============================================================================
// SCHEMA ZOD
// =============================================================================

export const informeAltaSchema = z.object({
  tipoDocumento: z.literal('informe-alta'),

  // Datos del paciente
  paciente: pacienteSchema,

  // Datos del episodio
  episodio: z.object({
    fechaIngreso: z.string().min(1, 'Fecha de ingreso requerida'),
    fechaAlta: z.string().min(1, 'Fecha de alta requerida'),
    servicioIngreso: z.string().min(1, 'Servicio de ingreso requerido'),
    motivoIngreso: z.string().optional(),
  }),

  // Diagnósticos
  diagnosticos: z.object({
    principal: z.string().min(1, 'Diagnóstico principal requerido'),
    secundarios: z.string().optional(),
  }),

  // Procedimientos
  procedimientos: z.string().optional(),

  // Evolución
  evolucion: z.string().min(1, 'Evolución requerida'),

  // Tratamiento y recomendaciones al alta
  alta: z.object({
    tratamiento: z.string().min(1, 'Tratamiento al alta requerido'),
    recomendaciones: z.string().min(1, 'Recomendaciones requeridas'),
    signosAlarma: z.string().optional(),
    citasSeguimiento: z.string().optional(),
  }),

  // Datos del médico
  medico: medicoSchema,
});

export type InformeAltaFormData = z.infer<typeof informeAltaSchema>;

// =============================================================================
// VALORES INICIALES
// =============================================================================

export const informeAltaInitialValues: InformeAltaFormData = {
  tipoDocumento: 'informe-alta',
  paciente: {
    nombre: '',
    edad: 0,
    sexo: 'No especificado',
    identificador: '',
  },
  episodio: {
    fechaIngreso: formatDateForInput(),
    fechaAlta: formatDateForInput(),
    servicioIngreso: '',
    motivoIngreso: '',
  },
  diagnosticos: {
    principal: '',
    secundarios: '',
  },
  procedimientos: '',
  evolucion: '',
  alta: {
    tratamiento: '',
    recomendaciones: '',
    signosAlarma: '',
    citasSeguimiento: '',
  },
  medico: {
    nombre: '',
    servicio: '',
    numeroColegiado: '',
    centro: '',
  },
};

// =============================================================================
// PLACEHOLDERS PARA PLANTILLA
// =============================================================================

export const informeAltaPlaceholders: PlaceholderInfo[] = [
  // Paciente
  { key: 'pacienteNombre', label: 'Nombre paciente', description: 'Nombre o iniciales', required: true, section: 'Paciente' },
  { key: 'pacienteEdad', label: 'Edad', description: 'Edad en años', required: true, section: 'Paciente' },
  { key: 'pacienteSexo', label: 'Sexo', description: 'Sexo del paciente', required: false, section: 'Paciente' },
  { key: 'pacienteIdentificador', label: 'NHC', description: 'Número de historia clínica', required: false, section: 'Paciente' },

  // Episodio
  { key: 'fechaIngreso', label: 'Fecha ingreso', description: 'Fecha de ingreso hospitalario', required: true, section: 'Episodio' },
  { key: 'fechaAlta', label: 'Fecha alta', description: 'Fecha de alta', required: true, section: 'Episodio' },
  { key: 'diasEstancia', label: 'Días estancia', description: 'Días de hospitalización (calculado)', required: false, section: 'Episodio' },
  { key: 'servicioIngreso', label: 'Servicio', description: 'Servicio de ingreso', required: true, section: 'Episodio' },
  { key: 'motivoIngreso', label: 'Motivo ingreso', description: 'Motivo del ingreso', required: false, section: 'Episodio' },

  // Diagnósticos
  { key: 'diagnosticoPrincipal', label: 'Diagnóstico principal', description: 'Diagnóstico principal al alta', required: true, section: 'Diagnósticos' },
  { key: 'diagnosticosSecundarios', label: 'Diagnósticos secundarios', description: 'Otros diagnósticos relevantes', required: false, section: 'Diagnósticos' },

  // Procedimientos y evolución
  { key: 'procedimientos', label: 'Procedimientos', description: 'Procedimientos realizados', required: false, section: 'Clínica' },
  { key: 'evolucion', label: 'Evolución', description: 'Resumen de la evolución', required: true, section: 'Clínica' },

  // Alta
  { key: 'tratamientoAlta', label: 'Tratamiento', description: 'Tratamiento al alta', required: true, section: 'Alta' },
  { key: 'recomendaciones', label: 'Recomendaciones', description: 'Recomendaciones al alta', required: true, section: 'Alta' },
  { key: 'signosAlarma', label: 'Signos alarma', description: 'Signos de alarma a vigilar', required: false, section: 'Alta' },
  { key: 'citasSeguimiento', label: 'Citas', description: 'Citas de seguimiento', required: false, section: 'Alta' },

  // Médico
  { key: 'medicoNombre', label: 'Médico', description: 'Nombre del médico', required: true, section: 'Médico' },
  { key: 'medicoServicio', label: 'Servicio médico', description: 'Servicio del médico', required: false, section: 'Médico' },
  { key: 'medicoNumeroColegiado', label: 'Nº colegiado', description: 'Número de colegiado', required: false, section: 'Médico' },
  { key: 'medicoCentro', label: 'Centro', description: 'Hospital/Centro', required: false, section: 'Médico' },

  // Meta
  { key: 'fechaActual', label: 'Fecha actual', description: 'Fecha de generación', required: false, section: 'Meta' },
];

// =============================================================================
// PLANTILLA POR DEFECTO
// =============================================================================

export const informeAltaDefaultTemplate = `INFORME DE ALTA HOSPITALARIA

═══════════════════════════════════════════════════════════

DATOS DEL PACIENTE
──────────────────
Paciente: {{pacienteNombre}}
Edad: {{pacienteEdad}} años
Sexo: {{pacienteSexo}}
{{#pacienteIdentificador}}NHC: {{pacienteIdentificador}}{{/pacienteIdentificador}}

EPISODIO
────────
Fecha de ingreso: {{fechaIngreso}}
Fecha de alta: {{fechaAlta}}
Días de estancia: {{diasEstancia}}
Servicio: {{servicioIngreso}}
{{#motivoIngreso}}Motivo de ingreso: {{motivoIngreso}}{{/motivoIngreso}}

═══════════════════════════════════════════════════════════

DIAGNÓSTICO PRINCIPAL
─────────────────────
{{diagnosticoPrincipal}}

{{#diagnosticosSecundarios}}
DIAGNÓSTICOS SECUNDARIOS
────────────────────────
{{diagnosticosSecundarios}}
{{/diagnosticosSecundarios}}

{{#procedimientos}}
PROCEDIMIENTOS REALIZADOS
─────────────────────────
{{procedimientos}}
{{/procedimientos}}

EVOLUCIÓN Y COMENTARIOS
───────────────────────
{{evolucion}}

═══════════════════════════════════════════════════════════

TRATAMIENTO AL ALTA
───────────────────
{{tratamientoAlta}}

RECOMENDACIONES
───────────────
{{recomendaciones}}

{{#signosAlarma}}
SIGNOS DE ALARMA - ACUDIR A URGENCIAS SI:
─────────────────────────────────────────
{{signosAlarma}}
{{/signosAlarma}}

{{#citasSeguimiento}}
CITAS DE SEGUIMIENTO
────────────────────
{{citasSeguimiento}}
{{/citasSeguimiento}}

═══════════════════════════════════════════════════════════

MÉDICO RESPONSABLE
──────────────────
{{medicoNombre}}
{{#medicoServicio}}Servicio: {{medicoServicio}}{{/medicoServicio}}
{{#medicoNumeroColegiado}}Nº Colegiado: {{medicoNumeroColegiado}}{{/medicoNumeroColegiado}}
{{#medicoCentro}}{{medicoCentro}}{{/medicoCentro}}

Fecha del informe: {{fechaActual}}`;

// =============================================================================
// FUNCIÓN PARA CONVERTIR DATOS A VARIABLES DE PLANTILLA
// =============================================================================

export function flattenInformeAltaData(data: InformeAltaFormData): Record<string, string> {
  // Calcular días de estancia
  const diasEstancia = calcularDiasEntre(
    data.episodio.fechaIngreso,
    data.episodio.fechaAlta
  );

  // Formatear fechas para mostrar
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
  };

  return {
    // Paciente
    pacienteNombre: data.paciente.nombre,
    pacienteEdad: data.paciente.edad.toString(),
    pacienteSexo: data.paciente.sexo,
    pacienteIdentificador: data.paciente.identificador || '',

    // Episodio
    fechaIngreso: formatDate(data.episodio.fechaIngreso),
    fechaAlta: formatDate(data.episodio.fechaAlta),
    diasEstancia: diasEstancia.toString(),
    servicioIngreso: data.episodio.servicioIngreso,
    motivoIngreso: data.episodio.motivoIngreso || '',

    // Diagnósticos
    diagnosticoPrincipal: data.diagnosticos.principal,
    diagnosticosSecundarios: data.diagnosticos.secundarios || '',

    // Procedimientos y evolución
    procedimientos: data.procedimientos || '',
    evolucion: data.evolucion,

    // Alta
    tratamientoAlta: data.alta.tratamiento,
    recomendaciones: data.alta.recomendaciones,
    signosAlarma: data.alta.signosAlarma || '',
    citasSeguimiento: data.alta.citasSeguimiento || '',

    // Médico
    medicoNombre: data.medico.nombre,
    medicoServicio: data.medico.servicio || '',
    medicoNumeroColegiado: data.medico.numeroColegiado || '',
    medicoCentro: data.medico.centro || '',

    // Meta
    fechaActual: formatearFechaActual(),
  };
}

// =============================================================================
// CONFIGURACIÓN DEL TIPO DE DOCUMENTO
// =============================================================================

export const informeAltaConfig: DocumentTypeConfig = {
  id: 'informe-alta',
  name: 'Informe de Alta',
  shortName: 'IA',
  description: 'Informe de alta hospitalaria con diagnósticos, evolución y recomendaciones',
  icon: '🏥',
  color: 'green',
  schema: informeAltaSchema,
  defaultTemplate: informeAltaDefaultTemplate,
  placeholders: informeAltaPlaceholders,
};
