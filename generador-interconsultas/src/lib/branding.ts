/**
 * Sistema de Branding por Centro / Clínica
 *
 * Permite personalizar la apariencia de la aplicación
 * con el nombre, logo y colores de la clínica.
 */

const BRANDING_KEY = 'generador-interconsultas-branding';

export interface BrandingConfig {
  nombreCentro: string;
  subtitulo?: string;
  colorPrincipal: string; // Hex color
  logoUrl?: string;
  mostrarEnDocumentos: boolean;
  mostrarEnHeader: boolean;
}

const defaultBranding: BrandingConfig = {
  nombreCentro: '',
  subtitulo: '',
  colorPrincipal: '#2563eb', // blue-600
  logoUrl: '',
  mostrarEnDocumentos: true,
  mostrarEnHeader: true,
};

/**
 * Obtener configuración de branding
 */
export function getBranding(): BrandingConfig {
  if (typeof window === 'undefined') return defaultBranding;

  try {
    const stored = localStorage.getItem(BRANDING_KEY);
    if (stored) {
      return { ...defaultBranding, ...JSON.parse(stored) };
    }
  } catch (error) {
    console.error('Error al leer branding:', error);
  }

  return defaultBranding;
}

/**
 * Guardar configuración de branding
 */
export function saveBranding(config: Partial<BrandingConfig>): void {
  if (typeof window === 'undefined') return;

  try {
    const current = getBranding();
    const updated = { ...current, ...config };
    localStorage.setItem(BRANDING_KEY, JSON.stringify(updated));
  } catch (error) {
    console.error('Error al guardar branding:', error);
  }
}

/**
 * Verificar si hay branding configurado
 */
export function hasBranding(): boolean {
  const branding = getBranding();
  return !!(branding.nombreCentro || branding.logoUrl);
}

/**
 * Resetear branding a valores por defecto
 */
export function resetBranding(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(BRANDING_KEY);
}

/**
 * Generar estilos CSS inline para el color principal
 */
export function getBrandingStyles(): {
  primaryBg: string;
  primaryText: string;
  primaryBorder: string;
} {
  const branding = getBranding();
  const color = branding.colorPrincipal || defaultBranding.colorPrincipal;

  return {
    primaryBg: color,
    primaryText: color,
    primaryBorder: color,
  };
}

/**
 * Colores predefinidos para selección rápida
 */
export const PRESET_COLORS = [
  { name: 'Azul', value: '#2563eb' },
  { name: 'Índigo', value: '#4f46e5' },
  { name: 'Violeta', value: '#7c3aed' },
  { name: 'Verde', value: '#059669' },
  { name: 'Turquesa', value: '#0891b2' },
  { name: 'Rojo', value: '#dc2626' },
  { name: 'Naranja', value: '#ea580c' },
  { name: 'Gris', value: '#475569' },
];

/**
 * Calcular si un color es oscuro (para texto contrastante)
 */
export function isColorDark(hexColor: string): boolean {
  const hex = hexColor.replace('#', '');
  const r = parseInt(hex.substring(0, 2), 16);
  const g = parseInt(hex.substring(2, 4), 16);
  const b = parseInt(hex.substring(4, 6), 16);

  // Calcular luminancia
  const luminance = (0.299 * r + 0.587 * g + 0.114 * b) / 255;
  return luminance < 0.5;
}
