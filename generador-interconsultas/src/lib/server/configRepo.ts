/**
 * Repositorio de configuración server-side
 *
 * Este módulo gestiona la persistencia de la configuración del sistema
 * usando el filesystem (JSON) como almacenamiento.
 *
 * IMPORTANTE: Este módulo solo debe importarse desde código server-side
 * (API routes, Server Components sin 'use client').
 *
 * ARQUITECTURA PARA MIGRACIÓN A BASE DE DATOS:
 * --------------------------------------------
 * Cuando se migre a Prisma/PostgreSQL:
 * 1. Crear modelos en prisma/schema.prisma:
 *    - Clinic (id, nombre, configuracion)
 *    - ServicioDestino (id, clinicId, nombre, activo)
 *    - Plantilla (id, clinicId, tipo, nombre, contenido, activa)
 *
 * 2. Reemplazar las funciones de este archivo por llamadas a Prisma:
 *    - loadConfiguracion() -> prisma.clinic.findUnique() + relaciones
 *    - saveConfiguracion() -> prisma.$transaction() para actualizar todo
 *
 * 3. Añadir clinicId como parámetro a todas las funciones para multi-tenant
 *
 * La interfaz ConfiguracionSistema se mantiene igual para que el resto
 * del código no necesite cambios.
 */

import { promises as fs } from 'fs';
import path from 'path';
import { ConfiguracionSistema, ServicioDestino, PlantillaConfig, TipoDocumento } from '@/types';
import {
  serviciosDestinoPorDefecto,
  plantillaInterconsultaPorDefecto,
} from '@/data/default-config';
import { randomUUID } from 'crypto';

// Ruta al archivo de configuración
// En producción, esto podría ser una variable de entorno
const CONFIG_DIR = path.join(process.cwd(), 'data');
const CONFIG_FILE = path.join(CONFIG_DIR, 'config.json');

/**
 * Estructura extendida de configuración para soportar múltiples plantillas
 * y preparar para multi-tenant
 */
export interface ConfiguracionSistemaExtendida extends ConfiguracionSistema {
  // ID de clínica para futuro soporte multi-tenant
  // Por ahora siempre será 'default'
  clinicId?: string;

  // Metadatos
  version?: string;
  ultimaModificacion?: string;

  // Plantillas organizadas por tipo de documento
  plantillasPorTipo?: {
    interconsulta?: PlantillaConfig;
    informe_alta?: PlantillaConfig;
    peticion_pruebas?: PlantillaConfig;
  };
}

/**
 * Genera la configuración por defecto
 */
function getConfiguracionPorDefecto(): ConfiguracionSistemaExtendida {
  const ahora = new Date().toISOString();

  return {
    clinicId: 'default',
    version: '1.0.0',
    ultimaModificacion: ahora,
    serviciosDestino: serviciosDestinoPorDefecto,
    plantillas: [plantillaInterconsultaPorDefecto],
    plantillasPorTipo: {
      interconsulta: plantillaInterconsultaPorDefecto,
    },
  };
}

/**
 * Asegura que el directorio de datos existe
 */
async function ensureDataDir(): Promise<void> {
  try {
    await fs.access(CONFIG_DIR);
  } catch {
    await fs.mkdir(CONFIG_DIR, { recursive: true });
  }
}

/**
 * Carga la configuración del sistema desde el archivo JSON
 *
 * Si el archivo no existe, lo crea con la configuración por defecto.
 * Esta función es idempotente y thread-safe para lectura.
 *
 * @param clinicId - ID de la clínica (para futuro multi-tenant, por ahora ignorado)
 * @returns Configuración del sistema
 */
export async function loadConfiguracion(
  clinicId: string = 'default'
): Promise<ConfiguracionSistemaExtendida> {
  await ensureDataDir();

  try {
    const data = await fs.readFile(CONFIG_FILE, 'utf-8');
    const config = JSON.parse(data) as ConfiguracionSistemaExtendida;

    // Migrar estructura antigua si es necesario
    if (!config.plantillasPorTipo && config.plantillas) {
      config.plantillasPorTipo = {
        interconsulta: config.plantillas.find(p => p.tipo === 'interconsulta'),
      };
    }

    // Asegurar que clinicId existe (para compatibilidad)
    if (!config.clinicId) {
      config.clinicId = clinicId;
    }

    return config;
  } catch (error) {
    // Si el archivo no existe o hay error de parseo, crear configuración por defecto
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      const defaultConfig = getConfiguracionPorDefecto();
      await saveConfiguracion(defaultConfig);
      return defaultConfig;
    }

    console.error('Error al cargar configuración:', error);
    // En caso de error de parseo, devolver configuración por defecto sin sobrescribir
    return getConfiguracionPorDefecto();
  }
}

/**
 * Guarda la configuración del sistema en el archivo JSON
 *
 * @param config - Configuración a guardar
 */
export async function saveConfiguracion(
  config: ConfiguracionSistemaExtendida
): Promise<void> {
  await ensureDataDir();

  // Actualizar timestamp
  config.ultimaModificacion = new Date().toISOString();

  // Sincronizar plantillasPorTipo con el array plantillas para compatibilidad
  if (config.plantillasPorTipo) {
    config.plantillas = Object.values(config.plantillasPorTipo).filter(
      (p): p is PlantillaConfig => p !== undefined
    );
  }

  try {
    await fs.writeFile(CONFIG_FILE, JSON.stringify(config, null, 2), 'utf-8');
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    throw new Error('No se pudo guardar la configuración');
  }
}

// =============================================================================
// OPERACIONES DE SERVICIOS DESTINO
// =============================================================================

/**
 * Obtiene todos los servicios destino activos
 */
export async function getServiciosDestino(): Promise<ServicioDestino[]> {
  const config = await loadConfiguracion();
  return config.serviciosDestino.filter(s => s.activo);
}

/**
 * Obtiene todos los servicios destino (incluyendo inactivos)
 */
export async function getAllServiciosDestino(): Promise<ServicioDestino[]> {
  const config = await loadConfiguracion();
  return config.serviciosDestino;
}

/**
 * Añade un nuevo servicio destino
 *
 * @param nombre - Nombre del servicio
 * @returns El servicio creado
 */
export async function addServicioDestino(nombre: string): Promise<ServicioDestino> {
  const config = await loadConfiguracion();

  const nuevoServicio: ServicioDestino = {
    id: randomUUID(),
    nombre: nombre.trim(),
    activo: true,
  };

  config.serviciosDestino.push(nuevoServicio);
  await saveConfiguracion(config);

  return nuevoServicio;
}

/**
 * Actualiza un servicio destino existente
 *
 * @param id - ID del servicio
 * @param updates - Campos a actualizar
 * @returns El servicio actualizado o null si no existe
 */
export async function updateServicioDestino(
  id: string,
  updates: Partial<Omit<ServicioDestino, 'id'>>
): Promise<ServicioDestino | null> {
  const config = await loadConfiguracion();

  const index = config.serviciosDestino.findIndex(s => s.id === id);
  if (index === -1) return null;

  config.serviciosDestino[index] = {
    ...config.serviciosDestino[index],
    ...updates,
  };

  await saveConfiguracion(config);
  return config.serviciosDestino[index];
}

/**
 * Elimina un servicio destino (lo marca como inactivo)
 *
 * @param id - ID del servicio
 * @returns true si se eliminó, false si no existía
 */
export async function deleteServicioDestino(id: string): Promise<boolean> {
  const config = await loadConfiguracion();

  const servicio = config.serviciosDestino.find(s => s.id === id);
  if (!servicio) return false;

  servicio.activo = false;
  await saveConfiguracion(config);

  return true;
}

/**
 * Elimina permanentemente un servicio destino
 * Usar con precaución - normalmente preferir deleteServicioDestino (soft delete)
 */
export async function hardDeleteServicioDestino(id: string): Promise<boolean> {
  const config = await loadConfiguracion();

  const initialLength = config.serviciosDestino.length;
  config.serviciosDestino = config.serviciosDestino.filter(s => s.id !== id);

  if (config.serviciosDestino.length === initialLength) return false;

  await saveConfiguracion(config);
  return true;
}

// =============================================================================
// OPERACIONES DE PLANTILLAS
// =============================================================================

/**
 * Obtiene la plantilla activa para un tipo de documento
 *
 * @param tipo - Tipo de documento ('interconsulta', 'informe_alta', etc.)
 * @returns La plantilla o null si no existe
 */
export async function getPlantilla(
  tipo: TipoDocumento = 'interconsulta'
): Promise<PlantillaConfig | null> {
  const config = await loadConfiguracion();

  // Primero buscar en plantillasPorTipo (nueva estructura)
  if (config.plantillasPorTipo?.[tipo]) {
    return config.plantillasPorTipo[tipo] ?? null;
  }

  // Fallback al array plantillas (estructura legacy)
  return config.plantillas.find(p => p.tipo === tipo && p.activa) ?? null;
}

/**
 * Obtiene todas las plantillas
 */
export async function getAllPlantillas(): Promise<PlantillaConfig[]> {
  const config = await loadConfiguracion();
  return config.plantillas;
}

/**
 * Guarda o actualiza una plantilla
 *
 * @param plantilla - Plantilla a guardar
 */
export async function savePlantilla(plantilla: PlantillaConfig): Promise<void> {
  const config = await loadConfiguracion();

  // Actualizar timestamp
  plantilla.fechaModificacion = new Date().toISOString();

  // Actualizar en plantillasPorTipo
  if (!config.plantillasPorTipo) {
    config.plantillasPorTipo = {};
  }
  config.plantillasPorTipo[plantilla.tipo] = plantilla;

  // También actualizar en el array para compatibilidad
  const index = config.plantillas.findIndex(p => p.id === plantilla.id);
  if (index >= 0) {
    config.plantillas[index] = plantilla;
  } else {
    config.plantillas.push(plantilla);
  }

  await saveConfiguracion(config);
}

/**
 * Crea una nueva plantilla para un tipo de documento
 *
 * @param tipo - Tipo de documento
 * @param nombre - Nombre de la plantilla
 * @param contenido - Contenido con placeholders
 * @returns La plantilla creada
 */
export async function createPlantilla(
  tipo: TipoDocumento,
  nombre: string,
  contenido: string
): Promise<PlantillaConfig> {
  const ahora = new Date().toISOString();

  const plantilla: PlantillaConfig = {
    id: `${tipo}-${randomUUID()}`,
    tipo,
    nombre,
    contenido,
    activa: true,
    fechaCreacion: ahora,
    fechaModificacion: ahora,
  };

  await savePlantilla(plantilla);
  return plantilla;
}

// =============================================================================
// OPERACIONES DE RESET / MANTENIMIENTO
// =============================================================================

/**
 * Restaura la configuración por defecto
 * ¡CUIDADO! Esto elimina todos los cambios del usuario
 */
export async function resetConfiguracion(): Promise<void> {
  const defaultConfig = getConfiguracionPorDefecto();
  await saveConfiguracion(defaultConfig);
}

/**
 * Verifica si el archivo de configuración existe
 */
export async function configExists(): Promise<boolean> {
  try {
    await fs.access(CONFIG_FILE);
    return true;
  } catch {
    return false;
  }
}

/**
 * Obtiene información del archivo de configuración
 */
export async function getConfigInfo(): Promise<{
  exists: boolean;
  path: string;
  size?: number;
  lastModified?: string;
}> {
  try {
    const stats = await fs.stat(CONFIG_FILE);
    return {
      exists: true,
      path: CONFIG_FILE,
      size: stats.size,
      lastModified: stats.mtime.toISOString(),
    };
  } catch {
    return {
      exists: false,
      path: CONFIG_FILE,
    };
  }
}
