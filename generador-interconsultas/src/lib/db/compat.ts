/**
 * Capa de compatibilidad entre el MVP (configRepo) y la nueva base de datos
 *
 * Este módulo proporciona las mismas funciones que configRepo.ts pero usando
 * el nuevo cliente de base de datos. Permite migrar gradualmente sin romper
 * el código existente.
 *
 * MIGRACIÓN:
 * 1. El código existente sigue usando configRepo (que ahora usa esta capa)
 * 2. El nuevo código puede usar directamente db.client
 * 3. Cuando toda la migración esté completa, eliminar este archivo
 */

import { getDbClient, db } from './client';
import { seedDatabase } from './seed';
import {
  Service,
  Template,
  DocumentType,
  generateId,
} from './types';
import {
  ServicioDestino,
  PlantillaConfig,
  TipoDocumento,
  ConfiguracionSistema,
} from '@/types';

// ID de clínica por defecto (para compatibilidad con MVP sin auth)
const DEFAULT_CLINIC_ID = 'default';
const DEFAULT_CLINIC_SLUG = 'clinica-demo';

// Variable para cachear el ID de la clínica
let cachedClinicId: string | null = null;

/**
 * Obtiene o crea la clínica por defecto
 * (necesario para MVP sin autenticación)
 */
async function ensureDefaultClinic(): Promise<string> {
  if (cachedClinicId) return cachedClinicId;

  const dbClient = getDbClient();
  let clinic = await dbClient.findClinicBySlug(DEFAULT_CLINIC_SLUG);

  if (!clinic) {
    // Inicializar la base de datos con datos por defecto
    const result = await seedDatabase();
    cachedClinicId = result.clinic.id;
    return cachedClinicId;
  }

  cachedClinicId = clinic.id;
  return cachedClinicId;
}

// =============================================================================
// CONVERSORES DE TIPOS
// =============================================================================

/**
 * Convierte Service (nuevo) a ServicioDestino (legacy)
 */
function serviceToServicioDestino(service: Service): ServicioDestino {
  return {
    id: service.id,
    nombre: service.name,
    activo: service.isActive,
  };
}

/**
 * Convierte ServicioDestino (legacy) a datos para crear Service
 */
function servicioDestinoToServiceData(
  servicio: Partial<ServicioDestino>,
  clinicId: string
): Partial<Service> {
  return {
    clinicId,
    name: servicio.nombre,
    isActive: servicio.activo,
  };
}

/**
 * Convierte DocumentType (nuevo) a TipoDocumento (legacy)
 */
function documentTypeToTipoDocumento(type: DocumentType): TipoDocumento {
  const mapping: Record<DocumentType, TipoDocumento> = {
    INTERCONSULTA: 'interconsulta',
    INFORME_ALTA: 'informe_alta',
    PETICION_PRUEBAS: 'peticion_pruebas',
    DERIVACION_PRIMARIA: 'interconsulta', // Fallback
    NOTA_EVOLUTIVA: 'interconsulta', // Fallback
    INFORME_SOCIAL: 'interconsulta', // Fallback
  };
  return mapping[type] || 'interconsulta';
}

/**
 * Convierte TipoDocumento (legacy) a DocumentType (nuevo)
 */
function tipoDocumentoToDocumentType(tipo: TipoDocumento): DocumentType {
  const mapping: Record<TipoDocumento, DocumentType> = {
    interconsulta: 'INTERCONSULTA',
    informe_alta: 'INFORME_ALTA',
    peticion_pruebas: 'PETICION_PRUEBAS',
  };
  return mapping[tipo] || 'INTERCONSULTA';
}

/**
 * Convierte Template (nuevo) a PlantillaConfig (legacy)
 */
function templateToPlantillaConfig(template: Template): PlantillaConfig {
  return {
    id: template.id,
    tipo: documentTypeToTipoDocumento(template.type),
    nombre: template.name,
    contenido: template.content,
    activa: template.isActive,
    fechaCreacion: template.createdAt.toISOString(),
    fechaModificacion: template.updatedAt.toISOString(),
  };
}

// =============================================================================
// FUNCIONES DE COMPATIBILIDAD - SERVICIOS
// =============================================================================

/**
 * Obtiene todos los servicios destino activos
 * Compatible con: configRepo.getServiciosDestino()
 */
export async function getServiciosDestino(): Promise<ServicioDestino[]> {
  const clinicId = await ensureDefaultClinic();
  const dbClient = getDbClient();
  const services = await dbClient.findServicesByClinic(clinicId);
  return services.map(serviceToServicioDestino);
}

/**
 * Obtiene todos los servicios destino (incluyendo inactivos)
 * Compatible con: configRepo.getAllServiciosDestino()
 */
export async function getAllServiciosDestino(): Promise<ServicioDestino[]> {
  const clinicId = await ensureDefaultClinic();
  const dbClient = getDbClient();
  const services = await dbClient.findServicesByClinic(clinicId, true);
  return services.map(serviceToServicioDestino);
}

/**
 * Añade un nuevo servicio destino
 * Compatible con: configRepo.addServicioDestino()
 */
export async function addServicioDestino(nombre: string): Promise<ServicioDestino> {
  const clinicId = await ensureDefaultClinic();
  const dbClient = getDbClient();

  const service = await dbClient.createService({
    clinicId,
    name: nombre.trim(),
    category: null,
    description: null,
    sortOrder: 0,
    isActive: true,
  });

  return serviceToServicioDestino(service);
}

/**
 * Actualiza un servicio destino
 * Compatible con: configRepo.updateServicioDestino()
 */
export async function updateServicioDestino(
  id: string,
  updates: Partial<Omit<ServicioDestino, 'id'>>
): Promise<ServicioDestino | null> {
  const clinicId = await ensureDefaultClinic();
  const dbClient = getDbClient();

  const service = await dbClient.updateService(id, clinicId, {
    name: updates.nombre,
    isActive: updates.activo,
  });

  return service ? serviceToServicioDestino(service) : null;
}

/**
 * Elimina un servicio destino (soft delete)
 * Compatible con: configRepo.deleteServicioDestino()
 */
export async function deleteServicioDestino(id: string): Promise<boolean> {
  const clinicId = await ensureDefaultClinic();
  const dbClient = getDbClient();
  return dbClient.deleteService(id, clinicId);
}

// =============================================================================
// FUNCIONES DE COMPATIBILIDAD - PLANTILLAS
// =============================================================================

/**
 * Obtiene la plantilla activa para un tipo de documento
 * Compatible con: configRepo.getPlantilla()
 */
export async function getPlantilla(
  tipo: TipoDocumento = 'interconsulta'
): Promise<PlantillaConfig | null> {
  const clinicId = await ensureDefaultClinic();
  const dbClient = getDbClient();

  const template = await dbClient.findTemplateByType(
    tipoDocumentoToDocumentType(tipo),
    clinicId
  );

  return template ? templateToPlantillaConfig(template) : null;
}

/**
 * Obtiene todas las plantillas
 * Compatible con: configRepo.getAllPlantillas()
 */
export async function getAllPlantillas(): Promise<PlantillaConfig[]> {
  const clinicId = await ensureDefaultClinic();
  const dbClient = getDbClient();
  const templates = await dbClient.findTemplatesByClinic(clinicId);
  return templates.map(templateToPlantillaConfig);
}

/**
 * Guarda o actualiza una plantilla
 * Compatible con: configRepo.savePlantilla()
 */
export async function savePlantilla(plantilla: PlantillaConfig): Promise<void> {
  const clinicId = await ensureDefaultClinic();
  const dbClient = getDbClient();

  const existingTemplate = await dbClient.findTemplate(plantilla.id, clinicId);

  if (existingTemplate) {
    await dbClient.updateTemplate(plantilla.id, clinicId, {
      name: plantilla.nombre,
      content: plantilla.contenido,
      isActive: plantilla.activa,
    });
  } else {
    await dbClient.createTemplate({
      clinicId,
      type: tipoDocumentoToDocumentType(plantilla.tipo),
      name: plantilla.nombre,
      description: null,
      content: plantilla.contenido,
      fieldsConfig: '[]',
      isDefault: false,
      isActive: plantilla.activa,
      version: 1,
      createdById: null,
    });
  }
}

// =============================================================================
// FUNCIONES DE COMPATIBILIDAD - CONFIGURACIÓN GENERAL
// =============================================================================

/**
 * Carga la configuración completa del sistema
 * Compatible con: configRepo.loadConfiguracion()
 */
export async function loadConfiguracion(
  clinicId: string = 'default'
): Promise<ConfiguracionSistema> {
  const actualClinicId = await ensureDefaultClinic();
  const dbClient = getDbClient();

  const [services, templates] = await Promise.all([
    dbClient.findServicesByClinic(actualClinicId, true),
    dbClient.findTemplatesByClinic(actualClinicId),
  ]);

  const serviciosDestino = services.map(serviceToServicioDestino);
  const plantillas = templates.map(templateToPlantillaConfig);

  // Construir plantillasPorTipo
  const plantillasPorTipo: ConfiguracionSistema['plantillasPorTipo'] = {};
  for (const plantilla of plantillas) {
    if (!plantillasPorTipo[plantilla.tipo]) {
      plantillasPorTipo[plantilla.tipo] = plantilla;
    }
  }

  return {
    clinicId: actualClinicId,
    version: '2.0.0',
    ultimaModificacion: new Date().toISOString(),
    serviciosDestino,
    plantillas,
    plantillasPorTipo,
  };
}

/**
 * Verifica si la base de datos está inicializada
 */
export async function isInitialized(): Promise<boolean> {
  const dbClient = getDbClient();
  const clinic = await dbClient.findClinicBySlug(DEFAULT_CLINIC_SLUG);
  return clinic !== null;
}

/**
 * Inicializa la base de datos si es necesario
 */
export async function ensureInitialized(): Promise<void> {
  const initialized = await isInitialized();
  if (!initialized) {
    await seedDatabase();
  }
}

// =============================================================================
// RE-EXPORTAR PARA COMPATIBILIDAD TOTAL
// =============================================================================

export { ensureDefaultClinic, DEFAULT_CLINIC_ID, DEFAULT_CLINIC_SLUG };
