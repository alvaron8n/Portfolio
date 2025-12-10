/**
 * Schema y tipos para Informe Social
 *
 * Define la estructura de datos para informes de trabajo social sanitario,
 * incluyendo situación sociofamiliar, recursos y plan de intervención.
 */

import { z } from 'zod';
import { pacienteSchema, PlaceholderInfo } from '../base/types';

// =============================================================================
// SCHEMA
// =============================================================================

export const informeSocialSchema = z.object({
  tipoDocumento: z.literal('informe-social'),

  // Datos del paciente
  paciente: pacienteSchema.extend({
    estadoCivil: z.string().optional(),
    ocupacion: z.string().optional(),
    nacionalidad: z.string().optional(),
  }),

  // Situación sociofamiliar
  situacion: z.object({
    convivencia: z.string().min(1, 'Situación de convivencia requerida'),
    vivienda: z.string().optional(),
    redesApoyo: z.string().optional(),
    cuidadorPrincipal: z.string().optional(),
    situacionEconomica: z.string().optional(),
  }),

  // Contexto clínico
  contexto: z.object({
    motivoIngreso: z.string().min(1, 'Motivo de ingreso requerido'),
    diagnosticos: z.string().optional(),
    gradoDependencia: z.enum([
      'Independiente',
      'Dependencia leve',
      'Dependencia moderada',
      'Dependencia severa',
      'Gran dependencia',
    ]),
    estadoCognitivo: z.string().optional(),
  }),

  // Valoración social
  valoracion: z.object({
    problemasDetectados: z.string().min(1, 'Problemas detectados requeridos'),
    necesidadesIdentificadas: z.string().optional(),
    factoresRiesgo: z.string().optional(),
    factoresProtectores: z.string().optional(),
  }),

  // Intervención
  intervencion: z.object({
    objetivos: z.string().optional(),
    recursosTramitados: z.string().optional(),
    recursosRecomendados: z.string().optional(),
    coordinaciones: z.string().optional(),
    planAlta: z.string().min(1, 'Plan al alta requerido'),
  }),

  // Trabajador social
  profesional: z.object({
    nombre: z.string().min(1, 'Nombre del profesional requerido'),
    numeroColegiado: z.string().optional(),
    servicio: z.string().optional(),
    centro: z.string().optional(),
  }),
});

export type InformeSocialFormData = z.infer<typeof informeSocialSchema>;

// =============================================================================
// VALORES INICIALES
// =============================================================================

export const informeSocialInitialValues: InformeSocialFormData = {
  tipoDocumento: 'informe-social',
  paciente: {
    nombre: '',
    edad: 0,
    sexo: 'No especificado',
    identificador: '',
    estadoCivil: '',
    ocupacion: '',
    nacionalidad: '',
  },
  situacion: {
    convivencia: '',
    vivienda: '',
    redesApoyo: '',
    cuidadorPrincipal: '',
    situacionEconomica: '',
  },
  contexto: {
    motivoIngreso: '',
    diagnosticos: '',
    gradoDependencia: 'Independiente',
    estadoCognitivo: '',
  },
  valoracion: {
    problemasDetectados: '',
    necesidadesIdentificadas: '',
    factoresRiesgo: '',
    factoresProtectores: '',
  },
  intervencion: {
    objetivos: '',
    recursosTramitados: '',
    recursosRecomendados: '',
    coordinaciones: '',
    planAlta: '',
  },
  profesional: {
    nombre: '',
    numeroColegiado: '',
    servicio: '',
    centro: '',
  },
};

// =============================================================================
// PLACEHOLDERS
// =============================================================================

export const informeSocialPlaceholders: PlaceholderInfo[] = [
  // Paciente
  { key: 'paciente_nombre', label: 'Nombre', description: 'Nombre o iniciales', required: true, section: 'Paciente' },
  { key: 'paciente_edad', label: 'Edad', description: 'Edad en años', required: true, section: 'Paciente' },
  { key: 'paciente_sexo', label: 'Sexo', description: 'Masculino/Femenino', required: true, section: 'Paciente' },
  { key: 'estado_civil', label: 'Estado civil', description: 'Soltero/Casado/etc.', required: false, section: 'Paciente' },

  // Situación
  { key: 'convivencia', label: 'Convivencia', description: 'Con quién vive', required: true, section: 'Situación' },
  { key: 'vivienda', label: 'Vivienda', description: 'Tipo y condiciones', required: false, section: 'Situación' },
  { key: 'redes_apoyo', label: 'Redes de apoyo', description: 'Familia, amigos, etc.', required: false, section: 'Situación' },
  { key: 'cuidador_principal', label: 'Cuidador principal', description: 'Quién cuida al paciente', required: false, section: 'Situación' },

  // Contexto
  { key: 'motivo_ingreso', label: 'Motivo de ingreso', description: 'Razón de hospitalización', required: true, section: 'Contexto' },
  { key: 'grado_dependencia', label: 'Grado de dependencia', description: 'Nivel de autonomía', required: true, section: 'Contexto' },

  // Valoración
  { key: 'problemas_detectados', label: 'Problemas detectados', description: 'Problemática social', required: true, section: 'Valoración' },
  { key: 'necesidades_identificadas', label: 'Necesidades', description: 'Necesidades sociales', required: false, section: 'Valoración' },

  // Intervención
  { key: 'recursos_tramitados', label: 'Recursos tramitados', description: 'Gestiones realizadas', required: false, section: 'Intervención' },
  { key: 'recursos_recomendados', label: 'Recursos recomendados', description: 'Recomendaciones', required: false, section: 'Intervención' },
  { key: 'plan_alta', label: 'Plan al alta', description: 'Destino y seguimiento', required: true, section: 'Intervención' },

  // Profesional
  { key: 'profesional_nombre', label: 'Trabajador social', description: 'Nombre del profesional', required: true, section: 'Profesional' },
];

// =============================================================================
// PLANTILLA POR DEFECTO
// =============================================================================

export const informeSocialDefaultTemplate = `INFORME SOCIAL SANITARIO
========================

DATOS DEL PACIENTE
------------------
Nombre: {{paciente_nombre}}
Edad: {{paciente_edad}} años | Sexo: {{paciente_sexo}}
{{#paciente_identificador}}NHC: {{paciente_identificador}}{{/paciente_identificador}}
{{#estado_civil}}Estado civil: {{estado_civil}}{{/estado_civil}}
{{#ocupacion}}Ocupación: {{ocupacion}}{{/ocupacion}}
{{#nacionalidad}}Nacionalidad: {{nacionalidad}}{{/nacionalidad}}

MOTIVO DE INTERVENCIÓN
----------------------
{{motivo_ingreso}}
{{#diagnosticos}}Diagnósticos: {{diagnosticos}}{{/diagnosticos}}
Grado de dependencia: {{grado_dependencia}}
{{#estado_cognitivo}}Estado cognitivo: {{estado_cognitivo}}{{/estado_cognitivo}}

SITUACIÓN SOCIOFAMILIAR
-----------------------
Convivencia: {{convivencia}}
{{#vivienda}}Vivienda: {{vivienda}}{{/vivienda}}
{{#redes_apoyo}}Redes de apoyo: {{redes_apoyo}}{{/redes_apoyo}}
{{#cuidador_principal}}Cuidador principal: {{cuidador_principal}}{{/cuidador_principal}}
{{#situacion_economica}}Situación económica: {{situacion_economica}}{{/situacion_economica}}

VALORACIÓN SOCIAL
-----------------
Problemas detectados:
{{problemas_detectados}}

{{#necesidades_identificadas}}Necesidades identificadas:
{{necesidades_identificadas}}{{/necesidades_identificadas}}

{{#factores_riesgo}}Factores de riesgo:
{{factores_riesgo}}{{/factores_riesgo}}

{{#factores_protectores}}Factores protectores:
{{factores_protectores}}{{/factores_protectores}}

INTERVENCIÓN SOCIAL
-------------------
{{#objetivos}}Objetivos:
{{objetivos}}{{/objetivos}}

{{#recursos_tramitados}}Recursos tramitados:
{{recursos_tramitados}}{{/recursos_tramitados}}

{{#recursos_recomendados}}Recursos recomendados:
{{recursos_recomendados}}{{/recursos_recomendados}}

{{#coordinaciones}}Coordinaciones:
{{coordinaciones}}{{/coordinaciones}}

PLAN AL ALTA
------------
{{plan_alta}}

━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

Trabajador/a Social: {{profesional_nombre}}
{{#profesional_colegiado}}Nº Colegiado: {{profesional_colegiado}}{{/profesional_colegiado}}
{{#profesional_servicio}}Servicio: {{profesional_servicio}}{{/profesional_servicio}}
{{#profesional_centro}}Centro: {{profesional_centro}}{{/profesional_centro}}

Fecha: {{fecha}}
`;

// =============================================================================
// UTILIDADES
// =============================================================================

/**
 * Convierte los datos del formulario en variables planas para la plantilla
 */
export function flattenInformeSocialData(
  data: InformeSocialFormData
): Record<string, string> {
  const hoy = new Date();
  const fecha = `${hoy.getDate().toString().padStart(2, '0')}/${(hoy.getMonth() + 1).toString().padStart(2, '0')}/${hoy.getFullYear()}`;

  return {
    // Paciente
    paciente_nombre: data.paciente.nombre,
    paciente_edad: data.paciente.edad.toString(),
    paciente_sexo: data.paciente.sexo,
    paciente_identificador: data.paciente.identificador || '',
    estado_civil: data.paciente.estadoCivil || '',
    ocupacion: data.paciente.ocupacion || '',
    nacionalidad: data.paciente.nacionalidad || '',

    // Situación
    convivencia: data.situacion.convivencia,
    vivienda: data.situacion.vivienda || '',
    redes_apoyo: data.situacion.redesApoyo || '',
    cuidador_principal: data.situacion.cuidadorPrincipal || '',
    situacion_economica: data.situacion.situacionEconomica || '',

    // Contexto
    motivo_ingreso: data.contexto.motivoIngreso,
    diagnosticos: data.contexto.diagnosticos || '',
    grado_dependencia: data.contexto.gradoDependencia,
    estado_cognitivo: data.contexto.estadoCognitivo || '',

    // Valoración
    problemas_detectados: data.valoracion.problemasDetectados,
    necesidades_identificadas: data.valoracion.necesidadesIdentificadas || '',
    factores_riesgo: data.valoracion.factoresRiesgo || '',
    factores_protectores: data.valoracion.factoresProtectores || '',

    // Intervención
    objetivos: data.intervencion.objetivos || '',
    recursos_tramitados: data.intervencion.recursosTramitados || '',
    recursos_recomendados: data.intervencion.recursosRecomendados || '',
    coordinaciones: data.intervencion.coordinaciones || '',
    plan_alta: data.intervencion.planAlta,

    // Profesional
    profesional_nombre: data.profesional.nombre,
    profesional_colegiado: data.profesional.numeroColegiado || '',
    profesional_servicio: data.profesional.servicio || '',
    profesional_centro: data.profesional.centro || '',

    // Fecha
    fecha,
  };
}

// Recursos sociales comunes para sugerencias
export const RECURSOS_SOCIALES = [
  'Servicio de Ayuda a Domicilio (SAD)',
  'Teleasistencia',
  'Centro de Día',
  'Residencia temporal',
  'Residencia permanente',
  'Ley de Dependencia',
  'Servicios Sociales de base',
  'Pensión no contributiva',
  'Renta Mínima de Inserción',
  'Bono social eléctrico',
  'Banco de alimentos',
  'Comedor social',
  'Alojamiento alternativo',
  'Programa de atención a personas sin hogar',
];

export const TIPOS_CONVIVENCIA = [
  'Solo/a',
  'Con cónyuge/pareja',
  'Con hijos',
  'Con familia extensa',
  'En residencia',
  'En piso tutelado',
  'Situación de calle',
];
