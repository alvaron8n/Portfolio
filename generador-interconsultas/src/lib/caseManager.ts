/**
 * Sistema de Gestión de Casos para Multi-Documento
 *
 * Permite guardar datos base de un paciente y reutilizarlos
 * para generar múltiples documentos (interconsulta, petición, etc.)
 */

const CASES_KEY = 'generador-interconsultas-cases';
const CURRENT_CASE_KEY = 'generador-interconsultas-current-case';

export interface CaseData {
  id: string;
  createdAt: string;
  updatedAt: string;
  nombre: string; // Nombre descriptivo del caso
  paciente: {
    nombre: string;
    edad: number;
    sexo: string;
    identificador?: string;
  };
  antecedentes?: string;
  exploracion?: string;
  tratamientoActual?: string;
  medico?: {
    nombre: string;
    servicio?: string;
    centro?: string;
  };
}

export interface SavedCase extends CaseData {
  documentosGenerados: {
    tipo: string;
    timestamp: string;
  }[];
}

/**
 * Generar ID único para un caso
 */
function generateCaseId(): string {
  return `case-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

/**
 * Obtener todos los casos guardados
 */
export function getSavedCases(): SavedCase[] {
  if (typeof window === 'undefined') return [];

  try {
    const stored = localStorage.getItem(CASES_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error al leer casos:', error);
  }
  return [];
}

/**
 * Guardar todos los casos
 */
function saveCases(cases: SavedCase[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CASES_KEY, JSON.stringify(cases));
  } catch (error) {
    console.error('Error al guardar casos:', error);
  }
}

/**
 * Crear un nuevo caso a partir de datos del formulario
 */
export function createCase(data: Omit<CaseData, 'id' | 'createdAt' | 'updatedAt'>): SavedCase {
  const now = new Date().toISOString();
  const newCase: SavedCase = {
    ...data,
    id: generateCaseId(),
    createdAt: now,
    updatedAt: now,
    documentosGenerados: [],
  };

  const cases = getSavedCases();
  cases.unshift(newCase);

  // Mantener solo los últimos 20 casos
  const trimmed = cases.slice(0, 20);
  saveCases(trimmed);

  return newCase;
}

/**
 * Actualizar un caso existente
 */
export function updateCase(id: string, updates: Partial<CaseData>): SavedCase | null {
  const cases = getSavedCases();
  const index = cases.findIndex(c => c.id === id);

  if (index >= 0) {
    cases[index] = {
      ...cases[index],
      ...updates,
      updatedAt: new Date().toISOString(),
    };
    saveCases(cases);
    return cases[index];
  }

  return null;
}

/**
 * Registrar que se ha generado un documento para un caso
 */
export function recordDocumentGenerated(caseId: string, tipoDocumento: string): void {
  const cases = getSavedCases();
  const caseData = cases.find(c => c.id === caseId);

  if (caseData) {
    caseData.documentosGenerados.push({
      tipo: tipoDocumento,
      timestamp: new Date().toISOString(),
    });
    caseData.updatedAt = new Date().toISOString();
    saveCases(cases);
  }
}

/**
 * Eliminar un caso
 */
export function deleteCase(id: string): void {
  const cases = getSavedCases();
  const filtered = cases.filter(c => c.id !== id);
  saveCases(filtered);
}

/**
 * Obtener un caso por ID
 */
export function getCaseById(id: string): SavedCase | null {
  const cases = getSavedCases();
  return cases.find(c => c.id === id) || null;
}

/**
 * Guardar caso actual en sesión (para wizard)
 */
export function setCurrentCase(caseData: SavedCase | null): void {
  if (typeof window === 'undefined') return;

  try {
    if (caseData) {
      sessionStorage.setItem(CURRENT_CASE_KEY, JSON.stringify(caseData));
    } else {
      sessionStorage.removeItem(CURRENT_CASE_KEY);
    }
  } catch (error) {
    console.error('Error al guardar caso actual:', error);
  }
}

/**
 * Obtener caso actual de sesión
 */
export function getCurrentCase(): SavedCase | null {
  if (typeof window === 'undefined') return null;

  try {
    const stored = sessionStorage.getItem(CURRENT_CASE_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error al leer caso actual:', error);
  }
  return null;
}

/**
 * Tipos de documentos disponibles para el wizard
 */
export interface DocumentType {
  id: string;
  nombre: string;
  descripcion: string;
  ruta: string;
  icon: string;
}

export const DOCUMENT_TYPES: DocumentType[] = [
  {
    id: 'interconsulta',
    nombre: 'Interconsulta',
    descripcion: 'Derivación a especialista',
    ruta: '/',
    icon: 'interconsulta',
  },
  {
    id: 'peticion-pruebas',
    nombre: 'Petición de Pruebas',
    descripcion: 'Solicitud de pruebas diagnósticas',
    ruta: '/documents/peticion-pruebas',
    icon: 'pruebas',
  },
  {
    id: 'nota-evolutiva',
    nombre: 'Nota Evolutiva',
    descripcion: 'Seguimiento del paciente',
    ruta: '/documents/nota-evolutiva',
    icon: 'evolutiva',
  },
  {
    id: 'informe-alta',
    nombre: 'Informe de Alta',
    descripcion: 'Informe al dar de alta',
    ruta: '/documents/informe-alta',
    icon: 'alta',
  },
  {
    id: 'informe-social',
    nombre: 'Informe Social',
    descripcion: 'Informe para trabajo social',
    ruta: '/documents/informe-social',
    icon: 'social',
  },
];

/**
 * Componente SVG para iconos de documentos (sin emojis)
 */
export function getDocumentIconClass(iconType: string): string {
  const iconClasses: Record<string, string> = {
    interconsulta: 'text-blue-600 dark:text-blue-400',
    pruebas: 'text-purple-600 dark:text-purple-400',
    evolutiva: 'text-green-600 dark:text-green-400',
    alta: 'text-amber-600 dark:text-amber-400',
    social: 'text-teal-600 dark:text-teal-400',
  };
  return iconClasses[iconType] || 'text-gray-600 dark:text-gray-400';
}
