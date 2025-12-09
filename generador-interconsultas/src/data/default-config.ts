/**
 * Configuración por defecto del sistema
 * En el MVP se usa como datos iniciales.
 * En producción, esto se cargaría desde la base de datos.
 */

import { ServicioDestino, PlantillaConfig } from '@/types';

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

export const plantillaInterconsultaPorDefecto: PlantillaConfig = {
  id: 'interconsulta-default',
  tipo: 'interconsulta',
  nombre: 'Plantilla Estándar de Interconsulta',
  contenido: `INTERCONSULTA A: {{servicioDestino}}
PRIORIDAD: {{prioridad}}

═══════════════════════════════════════════════════════════

DATOS DEL PACIENTE
──────────────────
Paciente: {{pacienteNombre}}
Edad: {{pacienteEdad}} años
Sexo: {{pacienteSexo}}
{{#pacienteIdentificador}}ID / Historia Clínica: {{pacienteIdentificador}}{{/pacienteIdentificador}}

═══════════════════════════════════════════════════════════

MOTIVO DE LA INTERCONSULTA
──────────────────────────
{{motivoPrincipal}}

{{#antecedentesRelevantes}}
ANTECEDENTES RELEVANTES
───────────────────────
{{antecedentesRelevantes}}
{{/antecedentesRelevantes}}

{{#exploracionDatosRelevantes}}
EXPLORACIÓN / DATOS RELEVANTES
──────────────────────────────
{{exploracionDatosRelevantes}}
{{/exploracionDatosRelevantes}}

{{#presuncionDiagnostica}}
PRESUNCIÓN DIAGNÓSTICA
──────────────────────
{{presuncionDiagnostica}}
{{/presuncionDiagnostica}}

{{#tratamientoActual}}
TRATAMIENTO ACTUAL RELEVANTE
────────────────────────────
{{tratamientoActual}}
{{/tratamientoActual}}

═══════════════════════════════════════════════════════════

DATOS DEL MÉDICO REMITENTE
──────────────────────────
{{#servicioRemitente}}Servicio remitente: {{servicioRemitente}}{{/servicioRemitente}}
Médico: {{medicoNombre}}
{{#medicoNumeroColegiado}}Nº Colegiado: {{medicoNumeroColegiado}}{{/medicoNumeroColegiado}}
{{#medicoCentro}}Centro / Hospital: {{medicoCentro}}{{/medicoCentro}}

Fecha: {{fechaActual}}`,
  activa: true,
  fechaCreacion: new Date().toISOString(),
  fechaModificacion: new Date().toISOString(),
};

export const configuracionPorDefecto = {
  serviciosDestino: serviciosDestinoPorDefecto,
  plantillas: [plantillaInterconsultaPorDefecto],
};
