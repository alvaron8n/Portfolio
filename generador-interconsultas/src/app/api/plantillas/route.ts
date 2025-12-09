/**
 * API Route: Gestión de plantillas de documentos
 *
 * GET /api/plantillas - Obtener todas las plantillas
 * GET /api/plantillas?tipo=interconsulta - Obtener plantilla por tipo
 * PUT /api/plantillas - Actualizar una plantilla existente
 * POST /api/plantillas/reset - Restaurar plantilla por defecto (en ruta separada)
 *
 * Los datos se persisten en data/config.json a través de configRepo.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getPlantilla,
  getAllPlantillas,
  savePlantilla,
  resetConfiguracion,
} from '@/lib/server/configRepo';
import { TipoDocumento, PlantillaConfig } from '@/types';

// Tipos de documento válidos
const TIPOS_VALIDOS: TipoDocumento[] = ['interconsulta', 'informe_alta', 'peticion_pruebas'];

/**
 * GET: Obtener plantillas
 *
 * Query params:
 * - tipo: tipo de documento (interconsulta, informe_alta, peticion_pruebas)
 *         Si no se especifica, devuelve todas las plantillas
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const tipo = searchParams.get('tipo') as TipoDocumento | null;

    // Si se especifica tipo, devolver solo esa plantilla
    if (tipo) {
      if (!TIPOS_VALIDOS.includes(tipo)) {
        return NextResponse.json(
          {
            error: `Tipo de documento no válido. Valores válidos: ${TIPOS_VALIDOS.join(', ')}`,
          },
          { status: 400 }
        );
      }

      const plantilla = await getPlantilla(tipo);

      if (!plantilla) {
        return NextResponse.json(
          { error: `No se encontró plantilla para el tipo: ${tipo}` },
          { status: 404 }
        );
      }

      return NextResponse.json({ plantilla });
    }

    // Si no se especifica tipo, devolver todas
    const plantillas = await getAllPlantillas();

    return NextResponse.json({
      plantillas,
      total: plantillas.length,
      tiposDisponibles: TIPOS_VALIDOS,
    });
  } catch (error) {
    console.error('Error al obtener plantillas:', error);
    return NextResponse.json(
      { error: 'Error al obtener las plantillas' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Actualizar una plantilla
 *
 * Body: PlantillaConfig (debe incluir id y tipo)
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, tipo, nombre, contenido, activa } = body;

    // Validaciones
    if (!id) {
      return NextResponse.json(
        { error: 'El ID de la plantilla es obligatorio' },
        { status: 400 }
      );
    }

    if (!tipo || !TIPOS_VALIDOS.includes(tipo)) {
      return NextResponse.json(
        {
          error: `Tipo de documento no válido. Valores válidos: ${TIPOS_VALIDOS.join(', ')}`,
        },
        { status: 400 }
      );
    }

    if (contenido !== undefined && typeof contenido !== 'string') {
      return NextResponse.json(
        { error: 'El contenido debe ser una cadena de texto' },
        { status: 400 }
      );
    }

    if (contenido !== undefined && contenido.length > 50000) {
      return NextResponse.json(
        { error: 'El contenido de la plantilla no puede exceder 50,000 caracteres' },
        { status: 400 }
      );
    }

    // Obtener plantilla existente para mantener campos no actualizados
    const plantillaExistente = await getPlantilla(tipo);

    const plantillaActualizada: PlantillaConfig = {
      id,
      tipo,
      nombre: nombre || plantillaExistente?.nombre || `Plantilla de ${tipo}`,
      contenido: contenido !== undefined ? contenido : (plantillaExistente?.contenido || ''),
      activa: activa !== undefined ? Boolean(activa) : (plantillaExistente?.activa ?? true),
      fechaCreacion: plantillaExistente?.fechaCreacion || new Date().toISOString(),
      fechaModificacion: new Date().toISOString(),
    };

    await savePlantilla(plantillaActualizada);

    return NextResponse.json({
      plantilla: plantillaActualizada,
      message: 'Plantilla actualizada correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar plantilla:', error);
    return NextResponse.json(
      { error: 'Error al actualizar la plantilla' },
      { status: 500 }
    );
  }
}

/**
 * POST: Operaciones especiales sobre plantillas
 *
 * Body: { action: 'reset' } - Restaura la configuración por defecto
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { action } = body;

    if (action === 'reset') {
      await resetConfiguracion();

      return NextResponse.json({
        success: true,
        message: 'Configuración restaurada a valores por defecto',
      });
    }

    return NextResponse.json(
      { error: 'Acción no válida. Acciones disponibles: reset' },
      { status: 400 }
    );
  } catch (error) {
    console.error('Error en operación de plantillas:', error);
    return NextResponse.json(
      { error: 'Error al procesar la operación' },
      { status: 500 }
    );
  }
}
