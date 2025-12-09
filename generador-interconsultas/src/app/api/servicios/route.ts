/**
 * API Route: Gestión de servicios destino
 *
 * GET /api/servicios - Obtener lista de servicios
 * POST /api/servicios - Añadir nuevo servicio
 * DELETE /api/servicios?id=xxx - Eliminar servicio
 *
 * En el MVP, los datos se gestionan en localStorage del cliente.
 * Esta API está preparada para cuando se migre a base de datos real.
 */

import { NextRequest, NextResponse } from 'next/server';
import { serviciosDestinoPorDefecto } from '@/data/default-config';

// GET: Obtener servicios (devuelve los por defecto en el MVP server-side)
export async function GET() {
  // En el MVP, los datos reales están en localStorage del cliente
  // Aquí devolvemos los valores por defecto para inicialización
  return NextResponse.json({
    servicios: serviciosDestinoPorDefecto,
    message: 'Servicios cargados desde configuración por defecto',
  });
}

// POST: Añadir nuevo servicio
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { nombre } = body;

    if (!nombre || typeof nombre !== 'string' || nombre.trim() === '') {
      return NextResponse.json(
        { error: 'El nombre del servicio es obligatorio' },
        { status: 400 }
      );
    }

    // En el MVP, la persistencia se hace en el cliente
    // Esta respuesta simula el comportamiento esperado
    const nuevoServicio = {
      id: Date.now().toString(),
      nombre: nombre.trim(),
      activo: true,
    };

    return NextResponse.json({
      servicio: nuevoServicio,
      message: 'Servicio creado. Guarde en localStorage del cliente.',
    });
  } catch (error) {
    console.error('Error al crear servicio:', error);
    return NextResponse.json(
      { error: 'Error al procesar la solicitud' },
      { status: 500 }
    );
  }
}

// DELETE: Eliminar servicio
export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = searchParams.get('id');

  if (!id) {
    return NextResponse.json(
      { error: 'Se requiere el ID del servicio a eliminar' },
      { status: 400 }
    );
  }

  // En el MVP, la eliminación se hace en el cliente
  return NextResponse.json({
    success: true,
    message: `Servicio ${id} marcado para eliminación. Actualice localStorage del cliente.`,
  });
}
