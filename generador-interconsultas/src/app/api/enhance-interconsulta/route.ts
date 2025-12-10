/**
 * API Route: Mejorar documento médico con IA
 *
 * POST /api/enhance-interconsulta
 *
 * Body: { text: string, mode?: 'improve' | 'format' | 'summarize' }
 * Response: { text: string } | { error: string, code?: string, retryable?: boolean }
 *
 * Usa OpenAI para procesar el texto según el modo seleccionado:
 * - improve: Mejora redacción y claridad
 * - format: Reestructura en formato profesional
 * - summarize: Genera resumen conciso
 *
 * NO modifica información clínica en ningún modo.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  enhanceInterconsultaText,
  isAIConfigured,
  getAIConfig,
  AIError,
  AIMode,
} from '@/lib/ai';

const VALID_MODES: AIMode[] = ['improve', 'format', 'summarize'];

export async function POST(request: NextRequest) {
  try {
    // Verificar si la IA está configurada
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error: 'La mejora con IA no está disponible. Configure OPENAI_API_KEY en las variables de entorno.',
          code: 'NOT_CONFIGURED',
        },
        { status: 400 }
      );
    }

    // Parsear el body
    let body;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'El cuerpo de la petición no es JSON válido.' },
        { status: 400 }
      );
    }

    const { text, mode = 'improve' } = body;

    // Validar modo
    if (!VALID_MODES.includes(mode)) {
      return NextResponse.json(
        {
          error: `Modo inválido. Modos válidos: ${VALID_MODES.join(', ')}`,
          code: 'INVALID_MODE',
        },
        { status: 400 }
      );
    }

    // La validación detallada se hace en enhanceInterconsultaText
    // pero hacemos una validación básica aquí para respuestas rápidas
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere un texto válido para procesar.', code: 'EMPTY_INPUT' },
        { status: 400 }
      );
    }

    // Procesar el texto con IA según el modo
    const enhancedText = await enhanceInterconsultaText(text, mode as AIMode);

    return NextResponse.json({ text: enhancedText, mode });
  } catch (error) {
    console.error('Error en enhance-interconsulta:', error);

    // Manejar errores específicos de IA
    if (error instanceof AIError) {
      const statusCode = getStatusCodeForAIError(error.code);
      return NextResponse.json(
        {
          error: error.message,
          code: error.code,
          retryable: error.retryable,
        },
        { status: statusCode }
      );
    }

    // Error desconocido
    return NextResponse.json(
      {
        error: 'Error inesperado al procesar el texto. Por favor, inténtelo de nuevo.',
        code: 'UNKNOWN_ERROR',
      },
      { status: 500 }
    );
  }
}

/**
 * Mapea códigos de error de IA a códigos HTTP
 */
function getStatusCodeForAIError(code: string): number {
  const statusMap: Record<string, number> = {
    NOT_CONFIGURED: 400,
    EMPTY_INPUT: 400,
    INPUT_TOO_LONG: 400,
    INVALID_MODE: 400,
    RATE_LIMITED: 429,
    TIMEOUT: 504,
    API_ERROR: 502,
    UNKNOWN_ERROR: 500,
  };
  return statusMap[code] || 500;
}

// GET para verificar si la IA está disponible
export async function GET() {
  const config = getAIConfig();
  return NextResponse.json({
    available: config.isConfigured,
    maxInputLength: config.maxInputLength,
    availableModes: config.availableModes,
    message: config.isConfigured
      ? 'La mejora con IA está disponible'
      : 'La mejora con IA no está configurada. Añada OPENAI_API_KEY.',
  });
}
