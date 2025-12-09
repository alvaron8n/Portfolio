/**
 * API Route: Mejorar interconsulta con IA
 *
 * POST /api/enhance-interconsulta
 *
 * Body: { text: string }
 * Response: { text: string } | { error: string, code?: string, retryable?: boolean }
 *
 * Usa OpenAI para mejorar la redacción del texto de interconsulta.
 * NO modifica información clínica, solo mejora la redacción.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  enhanceInterconsultaText,
  isAIConfigured,
  getAIConfig,
  AIError,
} from '@/lib/ai';

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

    const { text } = body;

    // La validación detallada se hace en enhanceInterconsultaText
    // pero hacemos una validación básica aquí para respuestas rápidas
    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere un texto válido para mejorar.', code: 'EMPTY_INPUT' },
        { status: 400 }
      );
    }

    // Mejorar el texto con IA
    const enhancedText = await enhanceInterconsultaText(text);

    return NextResponse.json({ text: enhancedText });
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
        error: 'Error inesperado al mejorar el texto. Por favor, inténtelo de nuevo.',
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
    message: config.isConfigured
      ? 'La mejora con IA está disponible'
      : 'La mejora con IA no está configurada. Añada OPENAI_API_KEY.',
  });
}
