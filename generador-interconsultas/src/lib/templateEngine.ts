/**
 * Motor de plantillas para generar documentos
 *
 * Soporta:
 * - Placeholders simples: {{campo}}
 * - Secciones condicionales: {{#campo}}contenido{{/campo}} (se muestra solo si el campo tiene valor)
 *
 * Diseñado para ser extensible a otros tipos de documentos.
 */

import { InterconsultaFormData, PlantillaConfig } from '@/types';
import { plantillaInterconsultaPorDefecto } from '@/data/default-config';

/**
 * Formatea la fecha actual en formato dd/mm/aaaa
 */
function formatearFechaActual(): string {
  const hoy = new Date();
  const dia = hoy.getDate().toString().padStart(2, '0');
  const mes = (hoy.getMonth() + 1).toString().padStart(2, '0');
  const anio = hoy.getFullYear();
  return `${dia}/${mes}/${anio}`;
}

/**
 * Convierte los datos del formulario a un mapa plano de variables
 * para usar en el motor de plantillas
 */
function flattenFormData(data: InterconsultaFormData): Record<string, string> {
  return {
    // Datos generales
    tipoDocumento: data.tipoDocumento,
    servicioRemitente: data.servicioRemitente || '',
    servicioDestino: data.servicioDestino,
    prioridad: data.prioridad,

    // Datos del paciente
    pacienteNombre: data.paciente.nombre,
    pacienteEdad: data.paciente.edad.toString(),
    pacienteSexo: data.paciente.sexo,
    pacienteIdentificador: data.paciente.identificador || '',

    // Información clínica
    motivoPrincipal: data.informacionClinica.motivoPrincipal,
    antecedentesRelevantes: data.informacionClinica.antecedentesRelevantes || '',
    exploracionDatosRelevantes: data.informacionClinica.exploracionDatosRelevantes || '',
    presuncionDiagnostica: data.informacionClinica.presuncionDiagnostica || '',
    tratamientoActual: data.informacionClinica.tratamientoActual || '',

    // Datos del médico
    medicoNombre: data.medico.nombre,
    medicoServicio: data.medico.servicio || '',
    medicoNumeroColegiado: data.medico.numeroColegiado || '',
    medicoCentro: data.medico.centro || '',

    // Metadatos
    fechaActual: formatearFechaActual(),
  };
}

/**
 * Procesa secciones condicionales en la plantilla
 * Sintaxis: {{#campo}}contenido{{/campo}}
 * El contenido solo se muestra si el campo tiene un valor no vacío
 */
function procesarSeccionesCondicionales(
  plantilla: string,
  variables: Record<string, string>
): string {
  // Regex para encontrar secciones condicionales: {{#campo}}...{{/campo}}
  const regex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

  return plantilla.replace(regex, (match, campo, contenido) => {
    const valor = variables[campo];
    // Si el campo tiene valor, devolver el contenido procesado
    // Si no, devolver cadena vacía
    if (valor && valor.trim() !== '') {
      return contenido;
    }
    return '';
  });
}

/**
 * Reemplaza los placeholders simples {{campo}} por sus valores
 */
function reemplazarPlaceholders(
  plantilla: string,
  variables: Record<string, string>
): string {
  return plantilla.replace(/\{\{(\w+)\}\}/g, (match, campo) => {
    return variables[campo] || '';
  });
}

/**
 * Limpia líneas vacías consecutivas y espacios innecesarios
 */
function limpiarTexto(texto: string): string {
  // Eliminar líneas que solo contienen espacios
  let resultado = texto.replace(/^\s+$/gm, '');

  // Eliminar más de dos saltos de línea consecutivos
  resultado = resultado.replace(/\n{3,}/g, '\n\n');

  // Eliminar espacios al final de las líneas
  resultado = resultado.replace(/[ \t]+$/gm, '');

  // Eliminar saltos de línea al inicio y final del documento
  resultado = resultado.trim();

  return resultado;
}

/**
 * Genera el texto de una interconsulta a partir de los datos del formulario
 *
 * @param data - Datos del formulario de interconsulta
 * @param plantilla - Plantilla a usar (opcional, usa la por defecto si no se proporciona)
 * @returns Texto formateado de la interconsulta
 */
export function buildInterconsultaText(
  data: InterconsultaFormData,
  plantilla?: PlantillaConfig
): string {
  // Usar plantilla proporcionada o la por defecto
  const plantillaActual = plantilla || plantillaInterconsultaPorDefecto;

  // Convertir datos del formulario a mapa de variables
  const variables = flattenFormData(data);

  // Procesar la plantilla
  let resultado = plantillaActual.contenido;

  // Primero procesar secciones condicionales
  resultado = procesarSeccionesCondicionales(resultado, variables);

  // Luego reemplazar placeholders simples
  resultado = reemplazarPlaceholders(resultado, variables);

  // Limpiar el texto resultante
  resultado = limpiarTexto(resultado);

  return resultado;
}

/**
 * Obtiene la lista de placeholders disponibles para una plantilla
 * Útil para mostrar ayuda al usuario en la configuración
 */
export function getPlaceholdersDisponibles(): { campo: string; descripcion: string }[] {
  return [
    { campo: 'tipoDocumento', descripcion: 'Tipo de documento (ej: interconsulta)' },
    { campo: 'servicioRemitente', descripcion: 'Servicio que solicita la interconsulta' },
    { campo: 'servicioDestino', descripcion: 'Servicio al que se dirige la interconsulta' },
    { campo: 'prioridad', descripcion: 'Prioridad (Urgente, Preferente, Normal)' },
    { campo: 'pacienteNombre', descripcion: 'Nombre o iniciales del paciente' },
    { campo: 'pacienteEdad', descripcion: 'Edad del paciente en años' },
    { campo: 'pacienteSexo', descripcion: 'Sexo del paciente' },
    { campo: 'pacienteIdentificador', descripcion: 'ID o historia clínica del paciente' },
    { campo: 'motivoPrincipal', descripcion: 'Motivo principal de la interconsulta' },
    { campo: 'antecedentesRelevantes', descripcion: 'Antecedentes médicos relevantes' },
    { campo: 'exploracionDatosRelevantes', descripcion: 'Datos de exploración relevantes' },
    { campo: 'presuncionDiagnostica', descripcion: 'Presunción diagnóstica' },
    { campo: 'tratamientoActual', descripcion: 'Tratamiento actual del paciente' },
    { campo: 'medicoNombre', descripcion: 'Nombre del médico remitente' },
    { campo: 'medicoServicio', descripcion: 'Servicio del médico remitente' },
    { campo: 'medicoNumeroColegiado', descripcion: 'Número de colegiado del médico' },
    { campo: 'medicoCentro', descripcion: 'Centro o hospital del médico' },
    { campo: 'fechaActual', descripcion: 'Fecha actual en formato dd/mm/aaaa' },
  ];
}

/**
 * Valida una plantilla comprobando que los placeholders sean válidos
 */
export function validarPlantilla(contenido: string): { valido: boolean; errores: string[] } {
  const errores: string[] = [];
  const placeholdersValidos = new Set(
    getPlaceholdersDisponibles().map(p => p.campo)
  );

  // Buscar todos los placeholders en la plantilla
  const regex = /\{\{#?(\w+)\}\}/g;
  let match;

  while ((match = regex.exec(contenido)) !== null) {
    const campo = match[1];
    if (!placeholdersValidos.has(campo)) {
      errores.push(`Placeholder desconocido: {{${campo}}}`);
    }
  }

  return {
    valido: errores.length === 0,
    errores,
  };
}
