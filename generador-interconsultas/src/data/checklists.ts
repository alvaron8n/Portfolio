/**
 * Sistema de Checklists de Revisión por Servicio
 *
 * Permite configurar listas de verificación específicas
 * para cada servicio destino, ayudando al médico a
 * asegurar que incluye toda la información necesaria.
 */

const CHECKLISTS_KEY = 'generador-interconsultas-checklists';

export type ChecklistItemType = 'informativo' | 'obligatorio' | 'recomendado';

export interface ChecklistItem {
  id: string;
  texto: string;
  tipo: ChecklistItemType;
}

export interface ChecklistServicio {
  servicioDestino: string;
  items: ChecklistItem[];
}

/**
 * Checklists por defecto con ejemplos genéricos
 */
const checklistsDefecto: ChecklistServicio[] = [
  {
    servicioDestino: 'default',
    items: [
      {
        id: 'general-1',
        texto: '¿Has completado los antecedentes relevantes para este motivo de consulta?',
        tipo: 'recomendado',
      },
      {
        id: 'general-2',
        texto: '¿La medicación actual relevante está actualizada?',
        tipo: 'recomendado',
      },
      {
        id: 'general-3',
        texto: '¿Has indicado la prioridad correctamente?',
        tipo: 'obligatorio',
      },
      {
        id: 'general-4',
        texto: '¿El motivo de consulta es claro y específico?',
        tipo: 'obligatorio',
      },
      {
        id: 'general-5',
        texto: '¿Los datos de contacto del paciente están correctos?',
        tipo: 'informativo',
      },
    ],
  },
  {
    servicioDestino: 'Cardiología',
    items: [
      {
        id: 'cardio-1',
        texto: '¿Has incluido los factores de riesgo cardiovascular?',
        tipo: 'obligatorio',
      },
      {
        id: 'cardio-2',
        texto: '¿Se adjuntan resultados de ECG reciente si está disponible?',
        tipo: 'recomendado',
      },
      {
        id: 'cardio-3',
        texto: '¿La tensión arterial actual está registrada?',
        tipo: 'recomendado',
      },
      {
        id: 'cardio-4',
        texto: '¿Se menciona tratamiento anticoagulante/antiagregante si lo hay?',
        tipo: 'obligatorio',
      },
    ],
  },
  {
    servicioDestino: 'Neurología',
    items: [
      {
        id: 'neuro-1',
        texto: '¿Has descrito la cronología de los síntomas?',
        tipo: 'obligatorio',
      },
      {
        id: 'neuro-2',
        texto: '¿Se incluye exploración neurológica básica?',
        tipo: 'recomendado',
      },
      {
        id: 'neuro-3',
        texto: '¿Se mencionan factores de riesgo vascular si es relevante?',
        tipo: 'recomendado',
      },
    ],
  },
  {
    servicioDestino: 'Digestivo',
    items: [
      {
        id: 'digest-1',
        texto: '¿Has especificado hábitos tóxicos relevantes?',
        tipo: 'recomendado',
      },
      {
        id: 'digest-2',
        texto: '¿Se incluyen síntomas de alarma si los hay?',
        tipo: 'obligatorio',
      },
      {
        id: 'digest-3',
        texto: '¿Se menciona tratamiento con IBP u otros fármacos digestivos?',
        tipo: 'recomendado',
      },
    ],
  },
];

/**
 * Obtener todos los checklists guardados
 */
export function getChecklists(): ChecklistServicio[] {
  if (typeof window === 'undefined') return checklistsDefecto;

  try {
    const stored = localStorage.getItem(CHECKLISTS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
    // Inicializar con checklists por defecto
    saveChecklists(checklistsDefecto);
    return checklistsDefecto;
  } catch (error) {
    console.error('Error al leer checklists:', error);
    return checklistsDefecto;
  }
}

/**
 * Guardar todos los checklists
 */
export function saveChecklists(checklists: ChecklistServicio[]): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(CHECKLISTS_KEY, JSON.stringify(checklists));
  } catch (error) {
    console.error('Error al guardar checklists:', error);
  }
}

/**
 * Obtener checklist para un servicio específico
 * Si no existe, devuelve el checklist por defecto
 */
export function getChecklistForServicio(servicio: string): ChecklistServicio {
  const checklists = getChecklists();
  const specific = checklists.find(c => c.servicioDestino === servicio);
  const defaultChecklist = checklists.find(c => c.servicioDestino === 'default');

  if (specific && defaultChecklist) {
    // Combinar checklist específico con el general
    return {
      servicioDestino: servicio,
      items: [...defaultChecklist.items, ...specific.items],
    };
  }

  return specific || defaultChecklist || { servicioDestino: servicio, items: [] };
}

/**
 * Actualizar checklist de un servicio
 */
export function updateChecklistForServicio(servicio: string, items: ChecklistItem[]): void {
  const checklists = getChecklists();
  const index = checklists.findIndex(c => c.servicioDestino === servicio);

  if (index >= 0) {
    checklists[index].items = items;
  } else {
    checklists.push({ servicioDestino: servicio, items });
  }

  saveChecklists(checklists);
}

/**
 * Añadir item a un checklist
 */
export function addChecklistItem(servicio: string, texto: string, tipo: ChecklistItemType): void {
  const checklists = getChecklists();
  let checklist = checklists.find(c => c.servicioDestino === servicio);

  if (!checklist) {
    checklist = { servicioDestino: servicio, items: [] };
    checklists.push(checklist);
  }

  checklist.items.push({
    id: `item-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    texto,
    tipo,
  });

  saveChecklists(checklists);
}

/**
 * Eliminar item de un checklist
 */
export function removeChecklistItem(servicio: string, itemId: string): void {
  const checklists = getChecklists();
  const checklist = checklists.find(c => c.servicioDestino === servicio);

  if (checklist) {
    checklist.items = checklist.items.filter(i => i.id !== itemId);
    saveChecklists(checklists);
  }
}

/**
 * Obtener lista de servicios con checklist personalizado
 */
export function getServiciosConChecklist(): string[] {
  const checklists = getChecklists();
  return checklists
    .filter(c => c.servicioDestino !== 'default')
    .map(c => c.servicioDestino);
}

/**
 * Estilo por tipo de item
 */
export const CHECKLIST_TYPE_STYLES: Record<ChecklistItemType, { bg: string; text: string; icon: string }> = {
  obligatorio: {
    bg: 'bg-red-50 dark:bg-red-900/20',
    text: 'text-red-700 dark:text-red-300',
    icon: '!',
  },
  recomendado: {
    bg: 'bg-amber-50 dark:bg-amber-900/20',
    text: 'text-amber-700 dark:text-amber-300',
    icon: '?',
  },
  informativo: {
    bg: 'bg-blue-50 dark:bg-blue-900/20',
    text: 'text-blue-700 dark:text-blue-300',
    icon: 'i',
  },
};
