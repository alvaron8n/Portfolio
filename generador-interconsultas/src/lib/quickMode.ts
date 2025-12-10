/**
 * Sistema de Modo Consulta Rápida
 *
 * Permite un flujo simplificado para médicos con poco tiempo,
 * mostrando solo campos esenciales y auto-generando borradores.
 */

const QUICK_MODE_KEY = 'generador-interconsultas-quick-mode';

export interface QuickModeConfig {
  enabled: boolean;
  autoGenerate: boolean; // Auto-generar cuando hay suficiente texto
  minCharsForAutoGenerate: number; // Mínimo de caracteres para auto-generar
}

const defaultConfig: QuickModeConfig = {
  enabled: false,
  autoGenerate: true,
  minCharsForAutoGenerate: 30,
};

/**
 * Obtener configuración del modo consulta rápida
 */
export function getQuickModeConfig(): QuickModeConfig {
  if (typeof window === 'undefined') return defaultConfig;

  try {
    const stored = localStorage.getItem(QUICK_MODE_KEY);
    if (stored) {
      return { ...defaultConfig, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error al leer configuración de modo rápido:', error);
  }

  return defaultConfig;
}

/**
 * Guardar configuración del modo consulta rápida
 */
export function saveQuickModeConfig(config: Partial<QuickModeConfig>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getQuickModeConfig();
    const updated = { ...current, ...config };
    localStorage.setItem(QUICK_MODE_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error al guardar configuración de modo rápido:', error);
  }
}

/**
 * Alternar modo consulta rápida
 */
export function toggleQuickMode(): boolean {
  const config = getQuickModeConfig();
  const newEnabled = !config.enabled;
  saveQuickModeConfig({ enabled: newEnabled });
  return newEnabled;
}

/**
 * Campos esenciales en modo consulta rápida
 */
export const QUICK_MODE_FIELDS = {
  essential: [
    'servicioDestino',
    'prioridad',
    'paciente.nombre',
    'paciente.edad',
    'informacionClinica.motivoPrincipal',
    'informacionClinica.exploracionDatosRelevantes',
    'informacionClinica.tratamientoActual',
    'medico.nombre',
  ],
  optional: [
    'servicioRemitente',
    'paciente.sexo',
    'paciente.identificador',
    'informacionClinica.antecedentesRelevantes',
    'informacionClinica.presuncionDiagnostica',
    'medico.servicio',
    'medico.numeroColegiado',
    'medico.centro',
  ],
};

/**
 * Verificar si un campo es esencial en modo rápido
 */
export function isEssentialField(fieldPath: string): boolean {
  return QUICK_MODE_FIELDS.essential.includes(fieldPath);
}

/**
 * Verificar si se puede auto-generar basado en los campos completados
 */
export function canAutoGenerate(motivo: string, exploracion: string, config?: QuickModeConfig): boolean {
  const cfg = config || getQuickModeConfig();
  if (!cfg.autoGenerate) return false;

  const minChars = cfg.minCharsForAutoGenerate;
  return motivo.length >= minChars && exploracion.length >= minChars;
}
