/**
 * API Route: Webhook para notificar creación de documentos
 *
 * POST /api/hooks/interconsulta-creada
 *
 * Este endpoint actúa como proxy para enviar datos a webhooks externos
 * (n8n, Zapier, Make, etc.) cuando se genera un documento.
 *
 * Body: {
 *   document: {
 *     type: string,
 *     text: string,
 *     formData: object,
 *     timestamp: string
 *   }
 * }
 *
 * El webhook externo se configura en las variables de entorno:
 * - WEBHOOK_URL: URL del webhook (n8n, Zapier, etc.)
 * - WEBHOOK_SECRET: Secreto opcional para autenticación
 */

import { NextRequest, NextResponse } from 'next/server';

interface WebhookPayload {
  document: {
    type: string;
    text: string;
    formData: Record<string, unknown>;
    timestamp: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    // Verificar que hay una URL de webhook configurada
    const webhookUrl = process.env.WEBHOOK_URL;

    if (!webhookUrl) {
      // Si no hay webhook configurado, simplemente devolver OK
      // (el cliente puede enviar requests incluso sin webhook)
      return NextResponse.json({
        success: true,
        message: 'No webhook configured, request ignored',
        sent: false,
      });
    }

    // Parsear el body
    let payload: WebhookPayload;
    try {
      payload = await request.json();
    } catch {
      return NextResponse.json(
        { error: 'Invalid JSON payload' },
        { status: 400 }
      );
    }

    // Validar payload
    if (!payload.document || !payload.document.type || !payload.document.text) {
      return NextResponse.json(
        { error: 'Missing required fields in document' },
        { status: 400 }
      );
    }

    // Preparar headers para el webhook
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      'User-Agent': 'GeneradorInterconsultas/2.0',
    };

    // Añadir secreto si está configurado
    const webhookSecret = process.env.WEBHOOK_SECRET;
    if (webhookSecret) {
      headers['X-Webhook-Secret'] = webhookSecret;
    }

    // Enviar al webhook externo
    const webhookResponse = await fetch(webhookUrl, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        event: 'document.created',
        timestamp: new Date().toISOString(),
        data: payload.document,
      }),
      // Timeout de 10 segundos para no bloquear la UI
      signal: AbortSignal.timeout(10000),
    });

    if (!webhookResponse.ok) {
      console.error('Webhook failed:', {
        status: webhookResponse.status,
        statusText: webhookResponse.statusText,
      });

      return NextResponse.json({
        success: false,
        message: 'Webhook request failed',
        status: webhookResponse.status,
      });
    }

    return NextResponse.json({
      success: true,
      message: 'Webhook sent successfully',
      sent: true,
    });
  } catch (error) {
    console.error('Error in webhook route:', error);

    // Si es timeout, no es un error crítico
    if (error instanceof Error && error.name === 'TimeoutError') {
      return NextResponse.json({
        success: false,
        message: 'Webhook request timed out',
        sent: false,
      });
    }

    return NextResponse.json(
      {
        error: 'Internal server error',
        message: error instanceof Error ? error.message : 'Unknown error',
      },
      { status: 500 }
    );
  }
}

// GET para verificar estado del webhook
export async function GET() {
  const webhookUrl = process.env.WEBHOOK_URL;
  const hasSecret = !!process.env.WEBHOOK_SECRET;

  return NextResponse.json({
    configured: !!webhookUrl,
    hasSecret,
    // No revelar la URL completa por seguridad, solo el dominio
    domain: webhookUrl ? new URL(webhookUrl).hostname : null,
  });
}
