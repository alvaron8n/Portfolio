/**
 * API Route: Gestión de servicios destino
 *
 * GET /api/servicios - Obtener lista de servicios activos
 * GET /api/servicios?all=true - Obtener todos los servicios (incluyendo inactivos)
 * POST /api/servicios - Añadir nuevo servicio
 * PUT /api/servicios - Actualizar servicio existente
 * DELETE /api/servicios?id=xxx - Eliminar servicio (soft delete)
 *
 * Los datos se persisten en data/config.json a través de configRepo.
 */

import { NextRequest, NextResponse } from 'next/server';
import {
  getServiciosDestino,
  getAllServiciosDestino,
  addServicioDestino,
  updateServicioDestino,
  deleteServicioDestino,
} from '@/lib/server/configRepo';

/**
 * GET: Obtener servicios destino
 *
 * Query params:
 * - all: si es 'true', devuelve también los servicios inactivos
 */
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeAll = searchParams.get('all') === 'true';

    const servicios = includeAll
      ? await getAllServiciosDestino()
      : await getServiciosDestino();

    return NextResponse.json({
      servicios,
      total: servicios.length,
    });
  } catch (error) {
    console.error('Error al obtener servicios:', error);
    return NextResponse.json(
      { error: 'Error al obtener los servicios' },
      { status: 500 }
    );
  }
}

/**
 * POST: Añadir nuevo servicio
 *
 * Body: { nombre: string }
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre } = body;

    // Validación
    if (!nombre || typeof nombre !== 'string') {
      return NextResponse.json(
        { error: 'El nombre del servicio es obligatorio' },
        { status: 400 }
      );
    }

    const nombreTrimmed = nombre.trim();
    if (nombreTrimmed.length === 0) {
      return NextResponse.json(
        { error: 'El nombre del servicio no puede estar vacío' },
        { status: 400 }
      );
    }

    if (nombreTrimmed.length > 100) {
      return NextResponse.json(
        { error: 'El nombre del servicio no puede exceder 100 caracteres' },
        { status: 400 }
      );
    }

    // Verificar que no existe ya un servicio con el mismo nombre
    const serviciosExistentes = await getAllServiciosDestino();
    const yaExiste = serviciosExistentes.some(
      s => s.nombre.toLowerCase() === nombreTrimmed.toLowerCase() && s.activo
    );

    if (yaExiste) {
      return NextResponse.json(
        { error: 'Ya existe un servicio con ese nombre' },
        { status: 409 }
      );
    }

    // Crear el servicio
    const nuevoServicio = await addServicioDestino(nombreTrimmed);

    return NextResponse.json(
      {
        servicio: nuevoServicio,
        message: 'Servicio creado correctamente',
      },
      { status: 201 }
    );
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return NextResponse.json(
      { error: 'Error al crear el servicio' },
      { status: 500 }
    );
  }
}

/**
 * PUT: Actualizar servicio existente
 *
 * Body: { id: string, nombre?: string, activo?: boolean }
 */
export async function PUT(request: NextRequest) {
  try {
    const body = await request.json();
    const { id, nombre, activo } = body;

    if (!id) {
      return NextResponse.json(
        { error: 'El ID del servicio es obligatorio' },
        { status: 400 }
      );
    }

    // Construir objeto de actualización
    const updates: { nombre?: string; activo?: boolean } = {};

    if (nombre !== undefined) {
      const nombreTrimmed = nombre.trim();
      if (nombreTrimmed.length === 0) {
        return NextResponse.json(
          { error: 'El nombre del servicio no puede estar vacío' },
          { status: 400 }
        );
      }
      updates.nombre = nombreTrimmed;
    }

    if (activo !== undefined) {
      updates.activo = Boolean(activo);
    }

    if (Object.keys(updates).length === 0) {
      return NextResponse.json(
        { error: 'No se proporcionaron campos para actualizar' },
        { status: 400 }
      );
    }

    const servicioActualizado = await updateServicioDestino(id, updates);

    if (!servicioActualizado) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      servicio: servicioActualizado,
      message: 'Servicio actualizado correctamente',
    });
  } catch (error) {
    console.error('Error al actualizar servicio:', error);
    return NextResponse.json(
      { error: 'Error al actualizar el servicio' },
      { status: 500 }
    );
  }
}

/**
 * DELETE: Eliminar servicio (soft delete)
 *
 * Query param: id - ID del servicio a eliminar
 */
export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get('id');

    if (!id) {
      return NextResponse.json(
        { error: 'Se requiere el ID del servicio a eliminar' },
        { status: 400 }
      );
    }

    const eliminado = await deleteServicioDestino(id);

    if (!eliminado) {
      return NextResponse.json(
        { error: 'Servicio no encontrado' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      message: 'Servicio eliminado correctamente',
    });
  } catch (error) {
    console.error('Error al eliminar servicio:', error);
    return NextResponse.json(
      { error: 'Error al eliminar el servicio' },
      { status: 500 }
    );
  }
}
