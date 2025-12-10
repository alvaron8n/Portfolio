/**
 * Seed de datos iniciales
 *
 * Este script inicializa la base de datos con:
 * - Una clínica por defecto
 * - Servicios destino estándar
 * - Plantillas para cada tipo de documento
 *
 * Ejecutar:
 *   npx ts-node src/lib/db/seed.ts
 *
 * O desde el código:
 *   import { seedDatabase } from '@/lib/db/seed';
 *   await seedDatabase();
 */

import { getDbClient } from './client';
import {
  generateId,
  generateSlug,
  DocumentType,
  type CreateClinic,
  type CreateService,
  type CreateTemplate,
} from './types';

// =============================================================================
// DATOS POR DEFECTO
// =============================================================================

const DEFAULT_CLINIC: CreateClinic = {
  name: 'Clínica Demo',
  slug: 'clinica-demo',
  nif: null,
  address: null,
  city: null,
  postalCode: null,
  phone: null,
  email: null,
  website: null,
  settings: JSON.stringify({
    theme: 'light',
    language: 'es',
  }),
  plan: 'FREE',
  maxUsers: 5,
  maxDocsMonth: 100,
  aiEnabled: true,
  webhooksEnabled: true,
  isActive: true,
};

const DEFAULT_SERVICES: Omit<CreateService, 'clinicId'>[] = [
  { name: 'Neurología', category: 'Especialidad', description: null, sortOrder: 1, isActive: true },
  { name: 'Cardiología', category: 'Especialidad', description: null, sortOrder: 2, isActive: true },
  { name: 'Traumatología', category: 'Especialidad', description: null, sortOrder: 3, isActive: true },
  { name: 'Digestivo', category: 'Especialidad', description: null, sortOrder: 4, isActive: true },
  { name: 'Neumología', category: 'Especialidad', description: null, sortOrder: 5, isActive: true },
  { name: 'Nefrología', category: 'Especialidad', description: null, sortOrder: 6, isActive: true },
  { name: 'Endocrinología', category: 'Especialidad', description: null, sortOrder: 7, isActive: true },
  { name: 'Reumatología', category: 'Especialidad', description: null, sortOrder: 8, isActive: true },
  { name: 'Dermatología', category: 'Especialidad', description: null, sortOrder: 9, isActive: true },
  { name: 'Urología', category: 'Especialidad', description: null, sortOrder: 10, isActive: true },
  { name: 'Ginecología', category: 'Especialidad', description: null, sortOrder: 11, isActive: true },
  { name: 'Oftalmología', category: 'Especialidad', description: null, sortOrder: 12, isActive: true },
  { name: 'Otorrinolaringología', category: 'Especialidad', description: null, sortOrder: 13, isActive: true },
  { name: 'Psiquiatría', category: 'Especialidad', description: null, sortOrder: 14, isActive: true },
  { name: 'Rehabilitación', category: 'Soporte', description: null, sortOrder: 15, isActive: true },
  { name: 'Trabajo Social', category: 'Soporte', description: null, sortOrder: 16, isActive: true },
  { name: 'Fisioterapia', category: 'Soporte', description: null, sortOrder: 17, isActive: true },
  { name: 'Medicina Interna', category: 'Especialidad', description: null, sortOrder: 18, isActive: true },
  { name: 'Cirugía General', category: 'Especialidad', description: null, sortOrder: 19, isActive: true },
  { name: 'Oncología', category: 'Especialidad', description: null, sortOrder: 20, isActive: true },
  { name: 'Hematología', category: 'Especialidad', description: null, sortOrder: 21, isActive: true },
  { name: 'Geriatría', category: 'Especialidad', description: null, sortOrder: 22, isActive: true },
  { name: 'Cuidados Paliativos', category: 'Especialidad', description: null, sortOrder: 23, isActive: true },
];

// =============================================================================
// PLANTILLAS POR TIPO DE DOCUMENTO
// =============================================================================

const PLANTILLA_INTERCONSULTA = `INTERCONSULTA A: {{servicioDestino}}
PRIORIDAD: {{prioridad}}

═══════════════════════════════════════════════════════════

DATOS DEL PACIENTE
──────────────────
Paciente: {{pacienteNombre}}
Edad: {{pacienteEdad}} años
Sexo: {{pacienteSexo}}
{{#pacienteIdentificador}}ID / Historia Clínica: {{pacienteIdentificador}}{{/pacienteIdentificador}}

═══════════════════════════════════════════════════════════

MOTIVO DE LA INTERCONSULTA
──────────────────────────
{{motivoPrincipal}}

{{#antecedentesRelevantes}}
ANTECEDENTES RELEVANTES
───────────────────────
{{antecedentesRelevantes}}
{{/antecedentesRelevantes}}

{{#exploracionDatosRelevantes}}
EXPLORACIÓN / DATOS RELEVANTES
──────────────────────────────
{{exploracionDatosRelevantes}}
{{/exploracionDatosRelevantes}}

{{#presuncionDiagnostica}}
PRESUNCIÓN DIAGNÓSTICA
──────────────────────
{{presuncionDiagnostica}}
{{/presuncionDiagnostica}}

{{#tratamientoActual}}
TRATAMIENTO ACTUAL RELEVANTE
────────────────────────────
{{tratamientoActual}}
{{/tratamientoActual}}

═══════════════════════════════════════════════════════════

DATOS DEL MÉDICO REMITENTE
──────────────────────────
{{#servicioRemitente}}Servicio remitente: {{servicioRemitente}}{{/servicioRemitente}}
Médico: {{medicoNombre}}
{{#medicoNumeroColegiado}}Nº Colegiado: {{medicoNumeroColegiado}}{{/medicoNumeroColegiado}}
{{#medicoCentro}}Centro / Hospital: {{medicoCentro}}{{/medicoCentro}}

Fecha: {{fechaActual}}`;

const PLANTILLA_INFORME_ALTA = `INFORME DE ALTA HOSPITALARIA

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
Servicio: {{servicioIngreso}}
Días de estancia: {{diasEstancia}}

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

{{#citasSeguimiento}}
CITAS DE SEGUIMIENTO
────────────────────
{{citasSeguimiento}}
{{/citasSeguimiento}}

{{#signosAlarma}}
SIGNOS DE ALARMA
────────────────
{{signosAlarma}}
{{/signosAlarma}}

═══════════════════════════════════════════════════════════

MÉDICO RESPONSABLE
──────────────────
{{medicoNombre}}
{{#medicoNumeroColegiado}}Nº Colegiado: {{medicoNumeroColegiado}}{{/medicoNumeroColegiado}}
{{#medicoCentro}}{{medicoCentro}}{{/medicoCentro}}

Fecha: {{fechaActual}}`;

const PLANTILLA_PETICION_PRUEBAS = `PETICIÓN DE PRUEBA DIAGNÓSTICA

═══════════════════════════════════════════════════════════

DATOS DEL PACIENTE
──────────────────
Paciente: {{pacienteNombre}}
Edad: {{pacienteEdad}} años
Sexo: {{pacienteSexo}}
{{#pacienteIdentificador}}NHC: {{pacienteIdentificador}}{{/pacienteIdentificador}}

═══════════════════════════════════════════════════════════

PRUEBA SOLICITADA
─────────────────
Tipo: {{tipoPrueba}}
Prioridad: {{prioridad}}

MOTIVO DE LA SOLICITUD
──────────────────────
{{motivoSolicitud}}

{{#sospechaDiagnostica}}
SOSPECHA DIAGNÓSTICA
────────────────────
{{sospechaDiagnostica}}
{{/sospechaDiagnostica}}

{{#antecedentesRelevantes}}
ANTECEDENTES RELEVANTES
───────────────────────
{{antecedentesRelevantes}}
{{/antecedentesRelevantes}}

{{#medicacionActual}}
MEDICACIÓN ACTUAL
─────────────────
{{medicacionActual}}
{{/medicacionActual}}

{{#alergias}}
ALERGIAS
────────
{{alergias}}
{{/alergias}}

{{#observaciones}}
OBSERVACIONES
─────────────
{{observaciones}}
{{/observaciones}}

═══════════════════════════════════════════════════════════

MÉDICO SOLICITANTE
──────────────────
{{medicoNombre}}
Servicio: {{servicioRemitente}}
{{#medicoNumeroColegiado}}Nº Colegiado: {{medicoNumeroColegiado}}{{/medicoNumeroColegiado}}

Fecha: {{fechaActual}}`;

const PLANTILLA_NOTA_EVOLUTIVA = `NOTA EVOLUTIVA

═══════════════════════════════════════════════════════════

DATOS DEL PACIENTE
──────────────────
Paciente: {{pacienteNombre}}
Edad: {{pacienteEdad}} años
{{#pacienteIdentificador}}NHC: {{pacienteIdentificador}}{{/pacienteIdentificador}}
Servicio: {{servicio}}
Cama: {{cama}}

Fecha y hora: {{fechaHora}}

═══════════════════════════════════════════════════════════

SUBJETIVO
─────────
{{subjetivo}}

OBJETIVO
────────
{{#constantesVitales}}
Constantes: {{constantesVitales}}
{{/constantesVitales}}

{{exploracionFisica}}

VALORACIÓN
──────────
{{valoracion}}

PLAN
────
{{plan}}

═══════════════════════════════════════════════════════════

{{medicoNombre}}
{{#medicoNumeroColegiado}}Col. {{medicoNumeroColegiado}}{{/medicoNumeroColegiado}}`;

const PLANTILLA_INFORME_SOCIAL = `INFORME PARA TRABAJO SOCIAL

═══════════════════════════════════════════════════════════

DATOS DEL PACIENTE
──────────────────
Paciente: {{pacienteNombre}}
Edad: {{pacienteEdad}} años
Sexo: {{pacienteSexo}}
{{#pacienteIdentificador}}NHC: {{pacienteIdentificador}}{{/pacienteIdentificador}}

═══════════════════════════════════════════════════════════

SITUACIÓN MÉDICA ACTUAL
───────────────────────
Diagnóstico principal: {{diagnosticoPrincipal}}

{{#situacionFuncional}}
Situación funcional: {{situacionFuncional}}
{{/situacionFuncional}}

{{#dependencia}}
Grado de dependencia: {{dependencia}}
{{/dependencia}}

MOTIVO DE DERIVACIÓN A TRABAJO SOCIAL
─────────────────────────────────────
{{motivoDerivacion}}

{{#necesidadesSociales}}
NECESIDADES DETECTADAS
──────────────────────
{{necesidadesSociales}}
{{/necesidadesSociales}}

{{#situacionFamiliar}}
SITUACIÓN FAMILIAR
──────────────────
{{situacionFamiliar}}
{{/situacionFamiliar}}

{{#recursosActuales}}
RECURSOS ACTUALES
─────────────────
{{recursosActuales}}
{{/recursosActuales}}

{{#observaciones}}
OBSERVACIONES
─────────────
{{observaciones}}
{{/observaciones}}

═══════════════════════════════════════════════════════════

MÉDICO QUE DERIVA
─────────────────
{{medicoNombre}}
Servicio: {{servicioRemitente}}
{{#medicoNumeroColegiado}}Nº Colegiado: {{medicoNumeroColegiado}}{{/medicoNumeroColegiado}}

Fecha: {{fechaActual}}`;

const DEFAULT_TEMPLATES: {
  type: DocumentType;
  name: string;
  description: string;
  content: string;
  isDefault: boolean;
}[] = [
  {
    type: 'INTERCONSULTA',
    name: 'Interconsulta Estándar',
    description: 'Plantilla estándar para solicitud de interconsulta a otras especialidades',
    content: PLANTILLA_INTERCONSULTA,
    isDefault: true,
  },
  {
    type: 'INFORME_ALTA',
    name: 'Informe de Alta Hospitalaria',
    description: 'Plantilla para informes de alta tras ingreso hospitalario',
    content: PLANTILLA_INFORME_ALTA,
    isDefault: true,
  },
  {
    type: 'PETICION_PRUEBAS',
    name: 'Petición de Pruebas Diagnósticas',
    description: 'Plantilla para solicitud de pruebas complementarias',
    content: PLANTILLA_PETICION_PRUEBAS,
    isDefault: true,
  },
  {
    type: 'NOTA_EVOLUTIVA',
    name: 'Nota Evolutiva (SOAP)',
    description: 'Plantilla para notas de evolución en formato SOAP',
    content: PLANTILLA_NOTA_EVOLUTIVA,
    isDefault: true,
  },
  {
    type: 'INFORME_SOCIAL',
    name: 'Informe para Trabajo Social',
    description: 'Plantilla para derivación a trabajo social',
    content: PLANTILLA_INFORME_SOCIAL,
    isDefault: true,
  },
];

// =============================================================================
// FUNCIÓN DE SEED
// =============================================================================

export async function seedDatabase(options?: {
  clinicName?: string;
  clinicSlug?: string;
  force?: boolean;
}): Promise<{
  clinic: { id: string; name: string; slug: string };
  servicesCount: number;
  templatesCount: number;
}> {
  const db = getDbClient();

  // Verificar si ya existe la clínica
  const existingClinic = await db.findClinicBySlug(
    options?.clinicSlug || DEFAULT_CLINIC.slug
  );

  if (existingClinic && !options?.force) {
    console.log('La base de datos ya está inicializada');
    return {
      clinic: {
        id: existingClinic.id,
        name: existingClinic.name,
        slug: existingClinic.slug,
      },
      servicesCount: (await db.findServicesByClinic(existingClinic.id)).length,
      templatesCount: (await db.findTemplatesByClinic(existingClinic.id)).length,
    };
  }

  console.log('Inicializando base de datos...');

  // Crear clínica
  const clinicData: CreateClinic = {
    ...DEFAULT_CLINIC,
    name: options?.clinicName || DEFAULT_CLINIC.name,
    slug: options?.clinicSlug || DEFAULT_CLINIC.slug,
  };
  const clinic = await db.createClinic(clinicData);
  console.log(`✓ Clínica creada: ${clinic.name} (${clinic.slug})`);

  // Crear servicios
  let servicesCount = 0;
  for (const serviceData of DEFAULT_SERVICES) {
    await db.createService({
      ...serviceData,
      clinicId: clinic.id,
    });
    servicesCount++;
  }
  console.log(`✓ ${servicesCount} servicios creados`);

  // Crear plantillas
  let templatesCount = 0;
  for (const templateData of DEFAULT_TEMPLATES) {
    await db.createTemplate({
      clinicId: clinic.id,
      type: templateData.type,
      name: templateData.name,
      description: templateData.description,
      content: templateData.content,
      fieldsConfig: '[]',
      isDefault: templateData.isDefault,
      isActive: true,
      version: 1,
      createdById: null,
    });
    templatesCount++;
  }
  console.log(`✓ ${templatesCount} plantillas creadas`);

  console.log('\n✓ Base de datos inicializada correctamente');

  return {
    clinic: {
      id: clinic.id,
      name: clinic.name,
      slug: clinic.slug,
    },
    servicesCount,
    templatesCount,
  };
}

// =============================================================================
// EJECUTAR COMO SCRIPT
// =============================================================================

// Si se ejecuta directamente (no como módulo)
if (require.main === module) {
  seedDatabase()
    .then((result) => {
      console.log('\nResultado:', JSON.stringify(result, null, 2));
      process.exit(0);
    })
    .catch((error) => {
      console.error('Error al inicializar:', error);
      process.exit(1);
    });
}
