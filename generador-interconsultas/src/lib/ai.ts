/**
 * Capa de servicio para integración con IA
 *
 * Actualmente usa OpenAI, pero diseñado para poder cambiar de proveedor.
 * El proveedor se puede cambiar modificando solo este archivo.
 */

import OpenAI from 'openai';

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
 * Mejora el texto de una interconsulta usando IA
 *
 * @param text - Texto original de la interconsulta
 * @returns Texto mejorado
 * @throws Error si la IA no está configurada o hay un error en la llamada
 */
export async function enhanceInterconsultaText(text: string): Promise<string> {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('La IA no está configurada. Añade OPENAI_API_KEY en las variables de entorno.');
  }

  const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  });

  try {
    const completion = await openai.chat.completions.create({
      model: 'gpt-4o-mini', // Modelo económico y rápido, suficiente para mejora de redacción
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
      temperature: 0.3, // Baja temperatura para resultados más consistentes
      max_tokens: 2000,
    });

    const enhancedText = completion.choices[0]?.message?.content;

    if (!enhancedText) {
      throw new Error('No se recibió respuesta de la IA');
    }

    return enhancedText.trim();
  } catch (error) {
    if (error instanceof OpenAI.APIError) {
      console.error('Error de API de OpenAI:', error.message);
      throw new Error(`Error al comunicarse con la IA: ${error.message}`);
    }
    throw error;
  }
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
