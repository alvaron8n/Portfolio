/**
 * Motor de plantillas genérico para documentos médicos
 *
 * Soporta:
 * - Placeholders simples: {{campo}}
 * - Secciones condicionales: {{#campo}}contenido{{/campo}}
 *
 * Este motor es independiente del tipo de documento.
 */

/**
 * Procesa secciones condicionales en la plantilla
 * Sintaxis: {{#campo}}...{{/campo}}
 * El contenido solo se muestra si el campo tiene un valor no vacío
 */
function procesarSeccionesCondicionales(
  plantilla: string,
  variables: Record<string, string>
): string {
  const regex = /\{\{#(\w+)\}\}([\s\S]*?)\{\{\/\1\}\}/g;

  return plantilla.replace(regex, (match, campo, contenido) => {
    const valor = variables[campo];
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
  let resultado = texto.replace(/^\s+$/gm, '');
  resultado = resultado.replace(/\n{3,}/g, '\n\n');
  resultado = resultado.replace(/[ \t]+$/gm, '');
  resultado = resultado.trim();
  return resultado;
}

/**
 * Genera el texto de un documento a partir de una plantilla y variables
 *
 * @param template - Plantilla con placeholders
 * @param variables - Mapa de variables a reemplazar
 * @returns Texto formateado del documento
 */
export function buildDocumentText(
  template: string,
  variables: Record<string, string>
): string {
  let resultado = template;

  // Primero procesar secciones condicionales
  resultado = procesarSeccionesCondicionales(resultado, variables);

  // Luego reemplazar placeholders simples
  resultado = reemplazarPlaceholders(resultado, variables);

  // Limpiar el texto resultante
  resultado = limpiarTexto(resultado);

  return resultado;
}

/**
 * Extrae todos los placeholders de una plantilla
 */
export function extractPlaceholders(template: string): string[] {
  const placeholders = new Set<string>();

  // Placeholders simples
  const simpleRegex = /\{\{(\w+)\}\}/g;
  let match;
  while ((match = simpleRegex.exec(template)) !== null) {
    placeholders.add(match[1]);
  }

  // Placeholders en secciones condicionales
  const conditionalRegex = /\{\{#(\w+)\}\}/g;
  while ((match = conditionalRegex.exec(template)) !== null) {
    placeholders.add(match[1]);
  }

  return Array.from(placeholders);
}

/**
 * Valida que todos los placeholders requeridos estén presentes
 */
export function validatePlaceholders(
  template: string,
  variables: Record<string, string>,
  requiredFields: string[]
): { valid: boolean; missing: string[] } {
  const missing = requiredFields.filter(
    field => !variables[field] || variables[field].trim() === ''
  );

  return {
    valid: missing.length === 0,
    missing,
  };
}
