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
 * Configuración general del sistema
 */
export interface ConfiguracionSistema {
  serviciosDestino: ServicioDestino[];
  plantillas: PlantillaConfig[];
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
