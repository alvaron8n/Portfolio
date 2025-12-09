/**
 * Capa de servicio para integración con IA
 *
 * Actualmente usa OpenAI, pero diseñado para poder cambiar de proveedor.
 * El proveedor se puede cambiar modificando solo este archivo.
 *
 * Configuración y límites:
 * - Modelo: gpt-4o-mini (económico y rápido)
 * - Límite de entrada: 10,000 caracteres
 * - Límite de salida: 2,000 tokens (~8,000 caracteres)
 * - Timeout: 30 segundos
 *
 * Para multi-tenant con rate limiting, considerar:
 * - Redis para tracking de uso por tenant
 * - Límites diarios/mensuales por plan
 */

import OpenAI from 'openai';

// Constantes de configuración
const AI_CONFIG = {
  model: 'gpt-4o-mini',
  maxInputLength: 10000,
  maxOutputTokens: 2000,
  temperature: 0.3,
  timeoutMs: 30000,
} as const;

// Tipos de error específicos para IA
export type AIErrorCode =
  | 'NOT_CONFIGURED'
  | 'INPUT_TOO_LONG'
  | 'EMPTY_INPUT'
  | 'RATE_LIMITED'
  | 'TIMEOUT'
  | 'API_ERROR'
  | 'UNKNOWN_ERROR';

export class AIError extends Error {
  constructor(
    message: string,
    public code: AIErrorCode,
    public retryable: boolean = false
  ) {
    super(message);
    this.name = 'AIError';
  }
}

// Prompt del sistema para mejorar interconsultas
const SYSTEM_PROMPT = `Eres un asistente especializado en documentación médica española.

Tu tarea es mejorar la redacción de interconsultas médicas siguiendo estas reglas ESTRICTAS:

1. SOLO mejora la redacción, claridad, ortografía y estructura del texto.
2. NUNCA añadas diagnósticos, datos clínicos, síntomas o información que no esté en el texto original.
3. NUNCA elimines información clínica presente en el original.
4. NUNCA hagas sugerencias médicas ni tomes decisiones clínicas.
5. Mantén un tono profesional y formal apropiado para documentación médica.
6. Usa terminología médica correcta en español.
7. Mejora la estructura y legibilidad manteniendo el formato de secciones.
8. Corrige errores ortográficos y gramaticales.
9. Elimina redundancias sin perder información.

El texto mejorado debe ser prácticamente idéntico en contenido al original, solo mejor redactado.`;

/**
 * Verifica si la IA está configurada
 */
export function isAIConfigured(): boolean {
  return !!process.env.OPENAI_API_KEY;
}

/**
 * Valida el texto de entrada antes de enviarlo a la IA
 */
function validateInput(text: string): void {
  if (!text || typeof text !== 'string') {
    throw new AIError(
      'El texto es requerido',
      'EMPTY_INPUT'
    );
  }

  const trimmedLength = text.trim().length;
  if (trimmedLength === 0) {
    throw new AIError(
      'El texto no puede estar vacío',
      'EMPTY_INPUT'
    );
  }

  if (trimmedLength > AI_CONFIG.maxInputLength) {
    throw new AIError(
      `El texto excede el límite de ${AI_CONFIG.maxInputLength.toLocaleString()} caracteres. Longitud actual: ${trimmedLength.toLocaleString()}`,
      'INPUT_TOO_LONG'
    );
  }
}

/**
 * Mejora el texto de una interconsulta usando IA
 *
 * @param text - Texto original de la interconsulta
 * @returns Texto mejorado
 * @throws AIError si hay cualquier problema
 */
export async function enhanceInterconsultaText(text: string): Promise<string> {
  // Validación de configuración
  if (!process.env.OPENAI_API_KEY) {
    throw new AIError(
      'La IA no está configurada. Añade OPENAI_API_KEY en las variables de entorno.',
      'NOT_CONFIGURED'
    );
  }

  // Validación de entrada
  validateInput(text);

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
    timeout: AI_CONFIG.timeoutMs,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: AI_CONFIG.model,
      messages: [
        {
          role: 'system',
          content: SYSTEM_PROMPT,
        },
        {
          role: 'user',
          content: `Por favor, mejora la redacción del siguiente texto de interconsulta médica. Recuerda: SOLO mejora la redacción, NO añadas ni modifiques información clínica.\n\n${text}`,
        },
      ],
      temperature: AI_CONFIG.temperature,
      max_tokens: AI_CONFIG.maxOutputTokens,
    });

    const enhancedText = completion.choices[0]?.message?.content;

    if (!enhancedText) {
      throw new AIError(
        'No se recibió respuesta de la IA',
        'API_ERROR',
        true
      );
    }

    return enhancedText.trim();
  } catch (error) {
    // Re-throw AIError as-is
    if (error instanceof AIError) {
      throw error;
    }

    // Handle OpenAI-specific errors
    if (error instanceof OpenAI.APIError) {
      console.error('Error de API de OpenAI:', error.message, { status: error.status });

      // Rate limiting
      if (error.status === 429) {
        throw new AIError(
          'Se ha superado el límite de peticiones. Por favor, espere un momento antes de intentarlo de nuevo.',
          'RATE_LIMITED',
          true
        );
      }

      // Server errors (retryable)
      if (error.status && error.status >= 500) {
        throw new AIError(
          'El servicio de IA no está disponible temporalmente. Por favor, inténtelo de nuevo.',
          'API_ERROR',
          true
        );
      }

      // Authentication/authorization errors
      if (error.status === 401 || error.status === 403) {
        throw new AIError(
          'Error de autenticación con el servicio de IA. Verifique la configuración.',
          'NOT_CONFIGURED'
        );
      }

      throw new AIError(
        `Error al comunicarse con la IA: ${error.message}`,
        'API_ERROR',
        error.status !== undefined && error.status >= 500
      );
    }

    // Timeout errors
    if (error instanceof Error && error.message.includes('timeout')) {
      throw new AIError(
        'La petición a la IA ha tardado demasiado. Por favor, inténtelo de nuevo.',
        'TIMEOUT',
        true
      );
    }

    // Unknown errors
    console.error('Error desconocido en IA:', error);
    throw new AIError(
      'Error inesperado al procesar la petición',
      'UNKNOWN_ERROR'
    );
  }
}

/**
 * Obtiene la configuración actual de IA (útil para mostrar límites en UI)
 */
export function getAIConfig() {
  return {
    maxInputLength: AI_CONFIG.maxInputLength,
    isConfigured: isAIConfigured(),
  };
}

/**
 * Interfaz para futuros proveedores de IA
 * Permite cambiar de OpenAI a otro proveedor implementando esta interfaz
 */
export interface AIProvider {
  isConfigured(): boolean;
  enhanceText(text: string): Promise<string>;
}

/**
 * Proveedor de OpenAI que implementa la interfaz AIProvider
 */
export const openAIProvider: AIProvider = {
  isConfigured: isAIConfigured,
  enhanceText: enhanceInterconsultaText,
};
