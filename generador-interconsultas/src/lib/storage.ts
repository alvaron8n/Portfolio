/**
 * Sistema de persistencia para el MVP
 *
 * En esta versión usamos localStorage en el cliente y datos por defecto.
 * La API está diseñada para facilitar la migración a una base de datos real.
 *
 * Para migrar a Prisma/PostgreSQL:
 * - Reemplazar las funciones de este archivo por llamadas a Prisma
 * - Mantener la misma interfaz para no afectar al resto del código
 */

import { ServicioDestino, PlantillaConfig, ConfiguracionSistema } from '@/types';
import {
  serviciosDestinoPorDefecto,
  plantillaInterconsultaPorDefecto
} from '@/data/default-config';

const STORAGE_KEY = 'generador-interconsultas-config';

/**
 * Obtiene la configuración del sistema
 * En el MVP, usa localStorage con fallback a datos por defecto
 */
export function getConfiguracion(): ConfiguracionSistema {
  if (typeof window === 'undefined') {
    // Server-side: devolver configuración por defecto
    return {
      serviciosDestino: serviciosDestinoPorDefecto,
      plantillas: [plantillaInterconsultaPorDefecto],
    };
  }

  try {
    const stored = localStorage.getItem(STORAGE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error al leer configuración:', error);
  }

  // Devolver configuración por defecto
  return {
    serviciosDestino: serviciosDestinoPorDefecto,
    plantillas: [plantillaInterconsultaPorDefecto],
  };
}

/**
 * Guarda la configuración del sistema
 */
export function saveConfiguracion(config: ConfiguracionSistema): void {
  if (typeof window === 'undefined') {
    console.warn('No se puede guardar en localStorage desde el servidor');
    return;
  }

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(config));
  } catch (error) {
    console.error('Error al guardar configuración:', error);
    throw new Error('No se pudo guardar la configuración');
  }
}

/**
 * Obtiene los servicios destino configurados
 */
export function getServiciosDestino(): ServicioDestino[] {
  const config = getConfiguracion();
  return config.serviciosDestino.filter(s => s.activo);
}

/**
 * Guarda los servicios destino
 */
export function saveServiciosDestino(servicios: ServicioDestino[]): void {
  const config = getConfiguracion();
  config.serviciosDestino = servicios;
  saveConfiguracion(config);
}

/**
 * Añade un nuevo servicio destino
 */
export function addServicioDestino(nombre: string): ServicioDestino {
  const config = getConfiguracion();
  const nuevoServicio: ServicioDestino = {
    id: Date.now().toString(),
    nombre,
    activo: true,
  };
  config.serviciosDestino.push(nuevoServicio);
  saveConfiguracion(config);
  return nuevoServicio;
}

/**
 * Elimina un servicio destino (lo marca como inactivo)
 */
export function removeServicioDestino(id: string): void {
  const config = getConfiguracion();
  const servicio = config.serviciosDestino.find(s => s.id === id);
  if (servicio) {
    servicio.activo = false;
    saveConfiguracion(config);
  }
}

/**
 * Obtiene la plantilla activa para un tipo de documento
 */
export function getPlantilla(tipo: string = 'interconsulta'): PlantillaConfig | null {
  const config = getConfiguracion();
  return config.plantillas.find(p => p.tipo === tipo && p.activa) || null;
}

/**
 * Guarda una plantilla
 */
export function savePlantilla(plantilla: PlantillaConfig): void {
  const config = getConfiguracion();
  const index = config.plantillas.findIndex(p => p.id === plantilla.id);

  plantilla.fechaModificacion = new Date().toISOString();

  if (index >= 0) {
    config.plantillas[index] = plantilla;
  } else {
    config.plantillas.push(plantilla);
  }

  saveConfiguracion(config);
}

/**
 * Restaura la configuración por defecto
 */
export function resetConfiguracion(): void {
  const config: ConfiguracionSistema = {
    serviciosDestino: serviciosDestinoPorDefecto,
    plantillas: [plantillaInterconsultaPorDefecto],
  };
  saveConfiguracion(config);
}
