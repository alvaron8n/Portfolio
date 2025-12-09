/**
 * API Route: Mejorar interconsulta con IA
 *
 * POST /api/enhance-interconsulta
 *
 * Body: { text: string }
 * Response: { text: string } | { error: string }
 *
 * Usa OpenAI para mejorar la redacción del texto de interconsulta.
 * NO modifica información clínica, solo mejora la redacción.
 */

import { NextRequest, NextResponse } from 'next/server';
import { enhanceInterconsultaText, isAIConfigured } from '@/lib/ai';

export async function POST(request: NextRequest) {
  try {
    // Verificar si la IA está configurada
    if (!isAIConfigured()) {
      return NextResponse.json(
        {
          error: 'La mejora con IA no está disponible. Configure OPENAI_API_KEY en las variables de entorno.',
        },
        { status: 400 }
      );
    }

    // Parsear el body
    const body = await request.json();
    const { text } = body;

    if (!text || typeof text !== 'string') {
      return NextResponse.json(
        { error: 'Se requiere un texto válido para mejorar.' },
        { status: 400 }
      );
    }

    if (text.length > 10000) {
      return NextResponse.json(
        { error: 'El texto es demasiado largo. Máximo 10,000 caracteres.' },
        { status: 400 }
      );
    }

    // Mejorar el texto con IA
    const enhancedText = await enhanceInterconsultaText(text);

    return NextResponse.json({ text: enhancedText });
  } catch (error) {
    console.error('Error en enhance-interconsulta:', error);

    const errorMessage =
      error instanceof Error ? error.message : 'Error desconocido al mejorar el texto';

    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}

// GET para verificar si la IA está disponible
export async function GET() {
  return NextResponse.json({
    available: isAIConfigured(),
    message: isAIConfigured()
      ? 'La mejora con IA está disponible'
      : 'La mejora con IA no está configurada. Añada OPENAI_API_KEY.',
  });
}
