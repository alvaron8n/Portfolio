/**
 * Sistema de Frases Rápidas y Macros Personales
 *
 * Permite a los médicos guardar frases frecuentes para insertar
 * rápidamente en los diferentes campos del formulario.
 *
 * Almacenamiento: localStorage (sin backend)
 */

const FRASES_KEY = 'generador-interconsultas-frases-rapidas';

export type SeccionFrase = 'motivo' | 'antecedentes' | 'exploracion' | 'presuncion' | 'tratamiento';

export interface FraseRapida {
  id: string;
  seccion: SeccionFrase;
  etiqueta: string; // Nombre corto para el botón
  texto: string; // Texto completo a insertar
  fechaCreacion: string;
  usos: number; // Contador de veces usada
}

/**
 * Frases de ejemplo iniciales (genéricas, no clínicas)
 */
const frasesEjemplo: FraseRapida[] = [
  {
    id: 'ejemplo-1',
    seccion: 'motivo',
    etiqueta: 'Valoración especializada',
    texto: 'Se solicita valoración especializada por el servicio correspondiente para orientación diagnóstica y terapéutica.',
    fechaCreacion: new Date().toISOString(),
    usos: 0,
  },
  {
    id: 'ejemplo-2',
    seccion: 'antecedentes',
    etiqueta: 'Sin antecedentes relevantes',
    texto: 'Sin antecedentes médico-quirúrgicos de interés para el motivo de consulta actual.',
    fechaCreacion: new Date().toISOString(),
    usos: 0,
  },
  {
    id: 'ejemplo-3',
    seccion: 'exploracion',
    etiqueta: 'Exploración general normal',
    texto: 'Paciente consciente, orientado, colaborador. Buen estado general. Constantes estables.',
    fechaCreacion: new Date().toISOString(),
    usos: 0,
  },
  {
    id: 'ejemplo-4',
    seccion: 'presuncion',
    etiqueta: 'Pendiente diagnóstico',
    texto: 'Pendiente de valoración especializada para establecer diagnóstico definitivo.',
    fechaCreacion: new Date().toISOString(),
    usos: 0,
  },
  {
    id: 'ejemplo-5',
    seccion: 'tratamiento',
    etiqueta: 'Tratamiento sintomático',
    texto: 'Tratamiento sintomático habitual. Pendiente de ajuste según valoración especializada.',
    fechaCreacion: new Date().toISOString(),
    usos: 0,
  },
];

/**
 * Obtener todas las frases rápidas del usuario
 */
export function getFrasesRapidas(): FraseRapida[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(FRASES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Inicializar con frases de ejemplo
    saveFrasesRapidas(frasesEjemplo);
    return frasesEjemplo;
  } catch (error) {
    console.error('Error al leer frases rápidas:', error);
    return [];
  }
}

/**
 * Guardar todas las frases rápidas
 */
export function saveFrasesRapidas(frases: FraseRapida[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(FRASES_KEY, JSON.stringify(frases));
  } catch (error) {
    console.error('Error al guardar frases rápidas:', error);
  }
}

/**
 * Obtener frases por sección
 */
export function getFrasesPorSeccion(seccion: SeccionFrase): FraseRapida[] {
  const todas = getFrasesRapidas();
  return todas.filter(f => f.seccion === seccion).sort((a, b) => b.usos - a.usos);
}

/**
 * Añadir una nueva frase rápida
 */
export function addFraseRapida(seccion: SeccionFrase, etiqueta: string, texto: string): FraseRapida {
  const frases = getFrasesRapidas();
  const nueva: FraseRapida = {
    id: `frase-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    seccion,
    etiqueta,
    texto,
    fechaCreacion: new Date().toISOString(),
    usos: 0,
  };
  frases.push(nueva);
  saveFrasesRapidas(frases);
  return nueva;
}

/**
 * Actualizar una frase rápida
 */
export function updateFraseRapida(id: string, updates: Partial<Omit<FraseRapida, 'id' | 'fechaCreacion'>>): void {
  const frases = getFrasesRapidas();
  const index = frases.findIndex(f => f.id === id);
  if (index >= 0) {
    frases[index] = { ...frases[index], ...updates };
    saveFrasesRapidas(frases);
  }
}

/**
 * Eliminar una frase rápida
 */
export function deleteFraseRapida(id: string): void {
  const frases = getFrasesRapidas();
  const filtered = frases.filter(f => f.id !== id);
  saveFrasesRapidas(filtered);
}

/**
 * Incrementar contador de usos de una frase
 */
export function incrementarUsoFrase(id: string): void {
  const frases = getFrasesRapidas();
  const frase = frases.find(f => f.id === id);
  if (frase) {
    frase.usos += 1;
    saveFrasesRapidas(frases);
  }
}

/**
 * Mapeo de sección a campo del formulario
 */
export const SECCION_TO_FIELD: Record<SeccionFrase, string> = {
  motivo: 'informacionClinica.motivoPrincipal',
  antecedentes: 'informacionClinica.antecedentesRelevantes',
  exploracion: 'informacionClinica.exploracionDatosRelevantes',
  presuncion: 'informacionClinica.presuncionDiagnostica',
  tratamiento: 'informacionClinica.tratamientoActual',
};

/**
 * Nombre legible de cada sección
 */
export const SECCION_LABELS: Record<SeccionFrase, string> = {
  motivo: 'Motivo principal',
  antecedentes: 'Antecedentes',
  exploracion: 'Exploración',
  presuncion: 'Presunción diagnóstica',
  tratamiento: 'Tratamiento',
};
