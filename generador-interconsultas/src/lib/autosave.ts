/**
 * Sistema de Autoguardado de Formularios
 *
 * Guarda automaticamente el progreso del formulario en localStorage
 * para evitar perdida de datos accidental.
 */

const AUTOSAVE_KEY = 'generador-interconsultas-autosave';
const AUTOSAVE_INTERVAL = 30000; // 30 segundos

export interface AutosaveData<T> {
  formType: string;
  data: T;
  timestamp: string;
}

/**
 * Guardar datos del formulario
 */
export function saveFormData<T>(formType: string, data: T): void {
  if (typeof window === 'undefined') return;

  try {
    const autosaveData: AutosaveData<T> = {
      formType,
      data,
      timestamp: new Date().toISOString(),
    };
    localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(autosaveData));
  } catch (error) {
    console.error('Error al autoguardar:', error);
  }
}

/**
 * Recuperar datos guardados del formulario
 */
export function getAutosavedData<T>(formType: string): T | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AUTOSAVE_KEY);
    if (stored) {
      const parsed: AutosaveData<T> = JSON.parse(stored);
      if (parsed.formType === formType) {
        return parsed.data;
      }
    }
  } catch (error) {
    console.error('Error al leer autoguardado:', error);
  }

  return null;
}

/**
 * Verificar si hay datos autoguardados
 */
export function hasAutosavedData(formType: string): boolean {
  if (typeof window === 'undefined') return false;

  try {
    const stored = localStorage.getItem(AUTOSAVE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      return parsed.formType === formType;
    }
  } catch {
    return false;
  }

  return false;
}

/**
 * Obtener timestamp del ultimo autoguardado
 */
export function getAutosaveTimestamp(formType: string): string | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = localStorage.getItem(AUTOSAVE_KEY);
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed.formType === formType) {
        return parsed.timestamp;
      }
    }
  } catch {
    return null;
  }

  return null;
}

/**
 * Limpiar datos autoguardados
 */
export function clearAutosave(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUTOSAVE_KEY);
}

/**
 * Hook helper para formatear timestamp de autoguardado
 */
export function formatAutosaveTime(timestamp: string): string {
  const date = new Date(timestamp);
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return 'hace unos segundos';
  if (diffMins === 1) return 'hace 1 minuto';
  if (diffMins < 60) return `hace ${diffMins} minutos`;

  const diffHours = Math.floor(diffMins / 60);
  if (diffHours === 1) return 'hace 1 hora';
  if (diffHours < 24) return `hace ${diffHours} horas`;

  return date.toLocaleDateString('es-ES', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

/**
 * Obtener intervalo de autoguardado en ms
 */
export function getAutosaveInterval(): number {
  return AUTOSAVE_INTERVAL;
}
