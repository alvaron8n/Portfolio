/**
 * Sistema de Historial de Borradores
 *
 * Permite guardar y recuperar borradores de documentos
 * para continuar el trabajo más tarde.
 */

const HISTORIAL_KEY = 'generador-interconsultas-historial';

export interface HistorialEntry {
  id: string;
  timestamp: string;
  tipoDocumento: string;
  titulo: string; // Resumen breve del documento
  formData: Record<string, unknown>;
  textoGenerado?: string;
}

const MAX_HISTORIAL = 50;

/**
 * Obtener historial de borradores
 */
export function getHistorial(): HistorialEntry[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(HISTORIAL_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error al leer historial:', error);
  }

  return [];
}

/**
 * Guardar historial
 */
function saveHistorial(historial: HistorialEntry[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(HISTORIAL_KEY, JSON.stringify(historial));
  } catch (error) {
    console.error('Error al guardar historial:', error);
  }
}

/**
 * Añadir entrada al historial
 */
export function addToHistorial(
  tipoDocumento: string,
  titulo: string,
  formData: Record<string, unknown>,
  textoGenerado?: string
): HistorialEntry {
  const historial = getHistorial();

  const entry: HistorialEntry = {
    id: `hist-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    tipoDocumento,
    titulo,
    formData,
    textoGenerado,
  };

  // Añadir al principio
  historial.unshift(entry);

  // Limitar tamaño
  const trimmed = historial.slice(0, MAX_HISTORIAL);
  saveHistorial(trimmed);

  return entry;
}

/**
 * Actualizar entrada del historial
 */
export function updateHistorialEntry(
  id: string,
  updates: Partial<Omit<HistorialEntry, 'id' | 'timestamp'>>
): void {
  const historial = getHistorial();
  const index = historial.findIndex(h => h.id === id);

  if (index >= 0) {
    historial[index] = { ...historial[index], ...updates };
    saveHistorial(historial);
  }
}

/**
 * Obtener entrada por ID
 */
export function getHistorialEntry(id: string): HistorialEntry | null {
  const historial = getHistorial();
  return historial.find(h => h.id === id) || null;
}

/**
 * Eliminar entrada del historial
 */
export function removeFromHistorial(id: string): void {
  const historial = getHistorial();
  const filtered = historial.filter(h => h.id !== id);
  saveHistorial(filtered);
}

/**
 * Limpiar todo el historial
 */
export function clearHistorial(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(HISTORIAL_KEY);
}

/**
 * Generar título automático para un borrador
 */
export function generateTitulo(
  tipoDocumento: string,
  pacienteNombre?: string,
  servicioDestino?: string
): string {
  const partes = [tipoDocumento];

  if (servicioDestino) {
    partes.push(`→ ${servicioDestino}`);
  }

  if (pacienteNombre) {
    partes.push(`(${pacienteNombre})`);
  }

  return partes.join(' ');
}
