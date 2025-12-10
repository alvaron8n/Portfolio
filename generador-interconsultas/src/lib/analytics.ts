/**
 * Sistema de Analítica de Uso (no clínico)
 *
 * Registra métricas de uso de la herramienta para mostrar
 * estadísticas al usuario sobre su productividad.
 *
 * NO almacena datos clínicos ni de pacientes.
 */

const ANALYTICS_KEY = 'generador-interconsultas-analytics';

export interface DocumentEvent {
  id: string;
  timestamp: string;
  tipoDocumento: string;
  servicioDestino: string;
  longitudTexto: number;
  iaUsada: boolean;
}

export interface AnalyticsData {
  eventos: DocumentEvent[];
  primeraFecha: string;
}

/**
 * Tiempo estimado que tarda un médico en escribir un documento manualmente (en minutos)
 */
const TIEMPO_ESTIMADO_MANUAL: Record<string, number> = {
  interconsulta: 10,
  'peticion-pruebas': 8,
  'nota-evolutiva': 12,
  'informe-alta': 15,
  'informe-social': 12,
  default: 10,
};

/**
 * Obtener datos de analítica
 */
export function getAnalyticsData(): AnalyticsData {
  if (typeof window === 'undefined') {
    return { eventos: [], primeraFecha: new Date().toISOString() };
  }

  try {
    const stored = localStorage.getItem(ANALYTICS_KEY);
    if (stored) {
      return JSON.parse(stored);
    }
  } catch (error) {
    console.error('Error al leer analítica:', error);
  }

  return { eventos: [], primeraFecha: new Date().toISOString() };
}

/**
 * Guardar datos de analítica
 */
function saveAnalyticsData(data: AnalyticsData): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(ANALYTICS_KEY, JSON.stringify(data));
  } catch (error) {
    console.error('Error al guardar analítica:', error);
  }
}

/**
 * Registrar la generación de un documento
 */
export function trackDocumentGenerated(
  tipoDocumento: string,
  servicioDestino: string,
  longitudTexto: number,
  iaUsada: boolean = false
): void {
  const data = getAnalyticsData();

  const evento: DocumentEvent = {
    id: `evt-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    timestamp: new Date().toISOString(),
    tipoDocumento,
    servicioDestino,
    longitudTexto,
    iaUsada,
  };

  data.eventos.push(evento);

  // Mantener solo los últimos 1000 eventos para no llenar localStorage
  if (data.eventos.length > 1000) {
    data.eventos = data.eventos.slice(-1000);
  }

  saveAnalyticsData(data);
}

/**
 * Obtener resumen de uso de los últimos N días
 */
export function getResumenUltimosDias(dias: number): {
  porDia: { fecha: string; total: number }[];
  total: number;
} {
  const data = getAnalyticsData();
  const ahora = new Date();
  const fechaLimite = new Date(ahora);
  fechaLimite.setDate(fechaLimite.getDate() - dias);

  const eventosFiltrados = data.eventos.filter(e => new Date(e.timestamp) >= fechaLimite);

  // Agrupar por día
  const porDia: Record<string, number> = {};
  for (let i = 0; i < dias; i++) {
    const fecha = new Date(ahora);
    fecha.setDate(fecha.getDate() - i);
    const key = fecha.toISOString().split('T')[0];
    porDia[key] = 0;
  }

  eventosFiltrados.forEach(e => {
    const key = e.timestamp.split('T')[0];
    if (porDia[key] !== undefined) {
      porDia[key]++;
    }
  });

  return {
    porDia: Object.entries(porDia)
      .map(([fecha, total]) => ({ fecha, total }))
      .sort((a, b) => a.fecha.localeCompare(b.fecha)),
    total: eventosFiltrados.length,
  };
}

/**
 * Obtener resumen por servicio
 */
export function getResumenPorServicio(): { servicio: string; total: number }[] {
  const data = getAnalyticsData();
  const porServicio: Record<string, number> = {};

  data.eventos.forEach(e => {
    const servicio = e.servicioDestino || 'Sin especificar';
    porServicio[servicio] = (porServicio[servicio] || 0) + 1;
  });

  return Object.entries(porServicio)
    .map(([servicio, total]) => ({ servicio, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Obtener resumen por tipo de documento
 */
export function getResumenPorTipo(): { tipo: string; total: number }[] {
  const data = getAnalyticsData();
  const porTipo: Record<string, number> = {};

  data.eventos.forEach(e => {
    porTipo[e.tipoDocumento] = (porTipo[e.tipoDocumento] || 0) + 1;
  });

  return Object.entries(porTipo)
    .map(([tipo, total]) => ({ tipo, total }))
    .sort((a, b) => b.total - a.total);
}

/**
 * Calcular tiempo estimado ahorrado
 */
export function getTiempoAhorradoEstimado(): {
  minutos: number;
  horas: number;
  descripcion: string;
} {
  const data = getAnalyticsData();
  let minutosTotal = 0;

  data.eventos.forEach(e => {
    const tiempo = TIEMPO_ESTIMADO_MANUAL[e.tipoDocumento] || TIEMPO_ESTIMADO_MANUAL.default;
    // Asumimos que la herramienta ahorra ~70% del tiempo
    minutosTotal += tiempo * 0.7;
  });

  const horas = Math.floor(minutosTotal / 60);
  const minutos = Math.round(minutosTotal % 60);

  let descripcion = '';
  if (horas > 0) {
    descripcion = `${horas} hora${horas > 1 ? 's' : ''} y ${minutos} minuto${minutos !== 1 ? 's' : ''}`;
  } else {
    descripcion = `${minutos} minuto${minutos !== 1 ? 's' : ''}`;
  }

  return { minutos: minutosTotal, horas, descripcion };
}

/**
 * Obtener estadísticas generales
 */
export function getEstadisticasGenerales(): {
  totalDocumentos: number;
  documentosConIA: number;
  porcentajeIA: number;
  caracteresGenerados: number;
  diasActivo: number;
} {
  const data = getAnalyticsData();

  const totalDocumentos = data.eventos.length;
  const documentosConIA = data.eventos.filter(e => e.iaUsada).length;
  const porcentajeIA = totalDocumentos > 0 ? Math.round((documentosConIA / totalDocumentos) * 100) : 0;
  const caracteresGenerados = data.eventos.reduce((sum, e) => sum + e.longitudTexto, 0);

  // Días únicos con actividad
  const diasUnicos = new Set(data.eventos.map(e => e.timestamp.split('T')[0]));
  const diasActivo = diasUnicos.size;

  return {
    totalDocumentos,
    documentosConIA,
    porcentajeIA,
    caracteresGenerados,
    diasActivo,
  };
}

/**
 * Exportar datos de analítica (para el usuario)
 */
export function exportAnalytics(): string {
  const data = getAnalyticsData();
  return JSON.stringify(data, null, 2);
}

/**
 * Limpiar datos de analítica
 */
export function clearAnalytics(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(ANALYTICS_KEY);
}
