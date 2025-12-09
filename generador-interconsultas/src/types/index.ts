/**
 * Tipos principales del dominio para el Generador de Interconsultas
 */

// Prioridades de interconsulta
export type Prioridad = 'Urgente' | 'Preferente' | 'Normal';

// Sexo del paciente
export type Sexo = 'Masculino' | 'Femenino' | 'No especificado';

// Tipos de documento (extensible para futuros documentos)
export type TipoDocumento = 'interconsulta' | 'informe_alta' | 'peticion_pruebas';

/**
 * Datos del paciente para la interconsulta
 */
export interface DatosPaciente {
  nombre: string;
  edad: number;
  sexo: Sexo;
  identificador?: string; // Historia clínica / ID
}

/**
 * Información clínica de la interconsulta
 */
export interface InformacionClinica {
  motivoPrincipal: string;
  antecedentesRelevantes?: string;
  exploracionDatosRelevantes?: string;
  presuncionDiagnostica?: string;
  tratamientoActual?: string;
}

/**
 * Datos del médico remitente
 */
export interface DatosMedico {
  nombre: string;
  servicio?: string;
  numeroColegiado?: string;
  centro?: string;
}

/**
 * Datos completos del formulario de interconsulta
 */
export interface InterconsultaFormData {
  // Datos generales
  tipoDocumento: TipoDocumento;
  servicioRemitente: string;
  servicioDestino: string;
  prioridad: Prioridad;

  // Datos del paciente
  paciente: DatosPaciente;

  // Información clínica
  informacionClinica: InformacionClinica;

  // Datos del médico
  medico: DatosMedico;
}

/**
 * Configuración de un servicio destino
 */
export interface ServicioDestino {
  id: string;
  nombre: string;
  activo: boolean;
}

/**
 * Configuración de una plantilla de documento
 */
export interface PlantillaConfig {
  id: string;
  tipo: TipoDocumento;
  nombre: string;
  contenido: string; // Texto con placeholders {{campo}}
  activa: boolean;
  fechaCreacion: string;
  fechaModificacion: string;
}

/**
 * Plantillas organizadas por tipo de documento
 * Facilita el acceso directo a la plantilla de cada tipo
 */
export interface PlantillasPorTipo {
  interconsulta?: PlantillaConfig;
  informe_alta?: PlantillaConfig;
  peticion_pruebas?: PlantillaConfig;
}

/**
 * Configuración general del sistema
 *
 * Esta interfaz está diseñada para ser compatible con:
 * - Persistencia en JSON (MVP actual)
 * - Futura migración a Prisma/PostgreSQL
 * - Soporte multi-tenant (multi-clínica)
 */
export interface ConfiguracionSistema {
  // ID de clínica para futuro soporte multi-tenant
  clinicId?: string;

  // Versión del esquema de configuración
  version?: string;

  // Timestamp de última modificación
  ultimaModificacion?: string;

  // Lista de servicios destino disponibles
  serviciosDestino: ServicioDestino[];

  // Array de plantillas (para compatibilidad legacy)
  plantillas: PlantillaConfig[];

  // Plantillas organizadas por tipo (nueva estructura preferida)
  plantillasPorTipo?: PlantillasPorTipo;
}

/**
 * Respuesta de la API de mejora con IA
 */
export interface EnhanceResponse {
  text: string;
  error?: string;
}

/**
 * Estado de validación del formulario
 */
export interface ValidationError {
  field: string;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: ValidationError[];
}
