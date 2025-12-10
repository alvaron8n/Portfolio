/**
 * Configuración por defecto del sistema
 * En el MVP se usa como datos iniciales.
 * En producción, esto se cargaría desde la base de datos.
 */

import { ServicioDestino, PlantillaConfig, TipoDocumento } from '@/types';

export const serviciosDestinoPorDefecto: ServicioDestino[] = [
  { id: '1', nombre: 'Neurología', activo: true },
  { id: '2', nombre: 'Cardiología', activo: true },
  { id: '3', nombre: 'Traumatología', activo: true },
  { id: '4', nombre: 'Digestivo', activo: true },
  { id: '5', nombre: 'Neumología', activo: true },
  { id: '6', nombre: 'Nefrología', activo: true },
  { id: '7', nombre: 'Endocrinología', activo: true },
  { id: '8', nombre: 'Reumatología', activo: true },
  { id: '9', nombre: 'Dermatología', activo: true },
  { id: '10', nombre: 'Urología', activo: true },
  { id: '11', nombre: 'Ginecología', activo: true },
  { id: '12', nombre: 'Oftalmología', activo: true },
  { id: '13', nombre: 'Otorrinolaringología', activo: true },
  { id: '14', nombre: 'Psiquiatría', activo: true },
  { id: '15', nombre: 'Rehabilitación', activo: true },
  { id: '16', nombre: 'Trabajo Social', activo: true },
  { id: '17', nombre: 'Fisioterapia', activo: true },
  { id: '18', nombre: 'Medicina Interna', activo: true },
  { id: '19', nombre: 'Cirugía General', activo: true },
  { id: '20', nombre: 'Oncología', activo: true },
  { id: '21', nombre: 'Hematología', activo: true },
  { id: '22', nombre: 'Geriatría', activo: true },
  { id: '23', nombre: 'Cuidados Paliativos', activo: true },
];

/**
 * Plantilla mejorada de Interconsulta
 * Estructura clara, profesional y legible para documentación médica
 */
export const plantillaInterconsultaPorDefecto: PlantillaConfig = {
  id: 'interconsulta-default',
  tipo: 'interconsulta',
  nombre: 'Plantilla Estándar de Interconsulta',
  contenido: `INTERCONSULTA AL SERVICIO DE {{servicioDestino}}

Prioridad: {{prioridad}}
Fecha: {{fechaActual}}

───────────────────────────────────────────────────────────────

DATOS DEL PACIENTE

Nombre/Iniciales: {{pacienteNombre}}
Edad: {{pacienteEdad}} años
Sexo: {{pacienteSexo}}
{{#pacienteIdentificador}}Nº Historia Clínica: {{pacienteIdentificador}}{{/pacienteIdentificador}}

───────────────────────────────────────────────────────────────

MOTIVO DE LA INTERCONSULTA

{{motivoPrincipal}}

{{#antecedentesRelevantes}}
───────────────────────────────────────────────────────────────

ANTECEDENTES RELEVANTES

{{antecedentesRelevantes}}
{{/antecedentesRelevantes}}

{{#exploracionDatosRelevantes}}
───────────────────────────────────────────────────────────────

EXPLORACIÓN Y DATOS RELEVANTES

{{exploracionDatosRelevantes}}
{{/exploracionDatosRelevantes}}

{{#presuncionDiagnostica}}
───────────────────────────────────────────────────────────────

PRESUNCIÓN DIAGNÓSTICA

{{presuncionDiagnostica}}
{{/presuncionDiagnostica}}

{{#tratamientoActual}}
───────────────────────────────────────────────────────────────

TRATAMIENTO ACTUAL

{{tratamientoActual}}
{{/tratamientoActual}}

───────────────────────────────────────────────────────────────

MÉDICO REMITENTE

{{medicoNombre}}
{{#servicioRemitente}}Servicio: {{servicioRemitente}}{{/servicioRemitente}}
{{#medicoNumeroColegiado}}Nº Colegiado: {{medicoNumeroColegiado}}{{/medicoNumeroColegiado}}
{{#medicoCentro}}Centro: {{medicoCentro}}{{/medicoCentro}}`,
  activa: true,
  fechaCreacion: new Date().toISOString(),
  fechaModificacion: new Date().toISOString(),
};

/**
 * Plantilla de Informe de Alta
 */
export const plantillaInformeAltaPorDefecto: PlantillaConfig = {
  id: 'informe-alta-default',
  tipo: 'informe_alta',
  nombre: 'Plantilla Estándar de Informe de Alta',
  contenido: `INFORME DE ALTA HOSPITALARIA

Fecha de ingreso: {{fechaIngreso}}
Fecha de alta: {{fechaAlta}}
Días de estancia: {{diasEstancia}}

───────────────────────────────────────────────────────────────

DATOS DEL PACIENTE

Nombre/Iniciales: {{pacienteNombre}}
Edad: {{pacienteEdad}} años
Sexo: {{pacienteSexo}}
{{#pacienteIdentificador}}Nº Historia Clínica: {{pacienteIdentificador}}{{/pacienteIdentificador}}

───────────────────────────────────────────────────────────────

SERVICIO DE INGRESO

{{servicioIngreso}}

───────────────────────────────────────────────────────────────

MOTIVO DE INGRESO

{{motivoIngreso}}

───────────────────────────────────────────────────────────────

DIAGNÓSTICO PRINCIPAL

{{diagnosticoPrincipal}}

{{#diagnosticosSecundarios}}
───────────────────────────────────────────────────────────────

DIAGNÓSTICOS SECUNDARIOS

{{diagnosticosSecundarios}}
{{/diagnosticosSecundarios}}

{{#procedimientos}}
───────────────────────────────────────────────────────────────

PROCEDIMIENTOS REALIZADOS

{{procedimientos}}
{{/procedimientos}}

───────────────────────────────────────────────────────────────

EVOLUCIÓN DURANTE EL INGRESO

{{evolucion}}

───────────────────────────────────────────────────────────────

TRATAMIENTO AL ALTA

{{tratamientoAlta}}

{{#recomendaciones}}
───────────────────────────────────────────────────────────────

RECOMENDACIONES

{{recomendaciones}}
{{/recomendaciones}}

───────────────────────────────────────────────────────────────

MÉDICO RESPONSABLE

{{medicoNombre}}
{{#medicoNumeroColegiado}}Nº Colegiado: {{medicoNumeroColegiado}}{{/medicoNumeroColegiado}}
{{#medicoCentro}}Centro: {{medicoCentro}}{{/medicoCentro}}

Fecha: {{fechaActual}}`,
  activa: true,
  fechaCreacion: new Date().toISOString(),
  fechaModificacion: new Date().toISOString(),
};

/**
 * Plantilla de Petición de Pruebas
 */
export const plantillaPeticionPruebasPorDefecto: PlantillaConfig = {
  id: 'peticion-pruebas-default',
  tipo: 'peticion_pruebas',
  nombre: 'Plantilla Estándar de Petición de Pruebas',
  contenido: `PETICIÓN DE PRUEBAS DIAGNÓSTICAS

Fecha: {{fechaActual}}
Prioridad: {{prioridad}}

───────────────────────────────────────────────────────────────

DATOS DEL PACIENTE

Nombre/Iniciales: {{pacienteNombre}}
Edad: {{pacienteEdad}} años
Sexo: {{pacienteSexo}}
{{#pacienteIdentificador}}Nº Historia Clínica: {{pacienteIdentificador}}{{/pacienteIdentificador}}

───────────────────────────────────────────────────────────────

DIAGNÓSTICO DE SOSPECHA

{{diagnosticoSospecha}}

───────────────────────────────────────────────────────────────

PRUEBAS SOLICITADAS

{{pruebasSolicitadas}}

───────────────────────────────────────────────────────────────

JUSTIFICACIÓN CLÍNICA

{{justificacionClinica}}

{{#informacionAdicional}}
───────────────────────────────────────────────────────────────

INFORMACIÓN ADICIONAL

{{informacionAdicional}}
{{/informacionAdicional}}

───────────────────────────────────────────────────────────────

MÉDICO SOLICITANTE

{{medicoNombre}}
{{#servicioRemitente}}Servicio: {{servicioRemitente}}{{/servicioRemitente}}
{{#medicoNumeroColegiado}}Nº Colegiado: {{medicoNumeroColegiado}}{{/medicoNumeroColegiado}}
{{#medicoCentro}}Centro: {{medicoCentro}}{{/medicoCentro}}`,
  activa: true,
  fechaCreacion: new Date().toISOString(),
  fechaModificacion: new Date().toISOString(),
};

/**
 * Todas las plantillas por defecto organizadas por tipo
 */
export const plantillasPorDefecto: Record<TipoDocumento, PlantillaConfig> = {
  interconsulta: plantillaInterconsultaPorDefecto,
  informe_alta: plantillaInformeAltaPorDefecto,
  peticion_pruebas: plantillaPeticionPruebasPorDefecto,
};

export const configuracionPorDefecto = {
  serviciosDestino: serviciosDestinoPorDefecto,
  plantillas: [
    plantillaInterconsultaPorDefecto,
    plantillaInformeAltaPorDefecto,
    plantillaPeticionPruebasPorDefecto,
  ],
  plantillasPorTipo: plantillasPorDefecto,
};
