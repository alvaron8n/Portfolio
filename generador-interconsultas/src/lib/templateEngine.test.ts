/**
 * Tests para el motor de plantillas
 */

import { describe, it, expect } from 'vitest';
import {
  buildInterconsultaText,
  getPlaceholdersDisponibles,
  validarPlantilla,
} from './templateEngine';
import { InterconsultaFormData, PlantillaConfig } from '@/types';

// Datos de prueba base
const datosBasicos: InterconsultaFormData = {
  tipoDocumento: 'interconsulta',
  servicioRemitente: 'Medicina Interna',
  servicioDestino: 'Cardiología',
  prioridad: 'Normal',
  paciente: {
    nombre: 'Paciente Test',
    edad: 65,
    sexo: 'Masculino',
    identificador: 'HC-12345',
  },
  informacionClinica: {
    motivoPrincipal: 'Valoración por soplo cardíaco',
    antecedentesRelevantes: 'HTA, DM2',
    exploracionDatosRelevantes: 'Soplo sistólico II/VI',
    presuncionDiagnostica: 'Valvulopatía a estudio',
    tratamientoActual: 'Enalapril 10mg/día',
  },
  medico: {
    nombre: 'Dr. García',
    servicio: 'Medicina Interna',
    numeroColegiado: '28/12345',
    centro: 'Hospital General',
  },
};

// Plantilla simple de prueba
const plantillaPrueba: PlantillaConfig = {
  id: 'test',
  tipo: 'interconsulta',
  nombre: 'Test',
  contenido: `INTERCONSULTA A {{servicioDestino}}
Prioridad: {{prioridad}}
Paciente: {{pacienteNombre}} ({{pacienteEdad}} años)
Motivo: {{motivoPrincipal}}
{{#antecedentesRelevantes}}
Antecedentes: {{antecedentesRelevantes}}
{{/antecedentesRelevantes}}
{{#presuncionDiagnostica}}
Diagnóstico: {{presuncionDiagnostica}}
{{/presuncionDiagnostica}}
Médico: {{medicoNombre}}`,
  activa: true,
  fechaCreacion: '2024-01-01',
  fechaModificacion: '2024-01-01',
};

describe('buildInterconsultaText', () => {
  it('debe generar texto con todos los placeholders básicos', () => {
    const resultado = buildInterconsultaText(datosBasicos, plantillaPrueba);

    expect(resultado).toContain('INTERCONSULTA A Cardiología');
    expect(resultado).toContain('Prioridad: Normal');
    expect(resultado).toContain('Paciente: Paciente Test (65 años)');
    expect(resultado).toContain('Motivo: Valoración por soplo cardíaco');
    expect(resultado).toContain('Médico: Dr. García');
  });

  it('debe incluir secciones condicionales cuando tienen valor', () => {
    const resultado = buildInterconsultaText(datosBasicos, plantillaPrueba);

    expect(resultado).toContain('Antecedentes: HTA, DM2');
    expect(resultado).toContain('Diagnóstico: Valvulopatía a estudio');
  });

  it('debe omitir secciones condicionales vacías', () => {
    const datosSinAntecedentes: InterconsultaFormData = {
      ...datosBasicos,
      informacionClinica: {
        ...datosBasicos.informacionClinica,
        antecedentesRelevantes: '',
        presuncionDiagnostica: '',
      },
    };

    const resultado = buildInterconsultaText(datosSinAntecedentes, plantillaPrueba);

    expect(resultado).not.toContain('Antecedentes:');
    expect(resultado).not.toContain('Diagnóstico:');
  });

  it('debe limpiar líneas vacías consecutivas', () => {
    const resultado = buildInterconsultaText(datosBasicos, plantillaPrueba);

    // No debe haber más de dos saltos de línea consecutivos
    expect(resultado).not.toMatch(/\n{3,}/);
  });

  it('debe usar plantilla por defecto si no se proporciona una', () => {
    const resultado = buildInterconsultaText(datosBasicos);

    // Debe generar algún texto (la plantilla por defecto genera contenido)
    expect(resultado.length).toBeGreaterThan(0);
    expect(resultado).toContain('Cardiología');
  });
});

describe('getPlaceholdersDisponibles', () => {
  it('debe devolver lista de placeholders', () => {
    const placeholders = getPlaceholdersDisponibles();

    expect(Array.isArray(placeholders)).toBe(true);
    expect(placeholders.length).toBeGreaterThan(0);
  });

  it('debe incluir placeholders básicos', () => {
    const placeholders = getPlaceholdersDisponibles();
    const campos = placeholders.map(p => p.campo);

    expect(campos).toContain('pacienteNombre');
    expect(campos).toContain('servicioDestino');
    expect(campos).toContain('motivoPrincipal');
    expect(campos).toContain('fechaActual');
  });

  it('cada placeholder debe tener campo y descripción', () => {
    const placeholders = getPlaceholdersDisponibles();

    placeholders.forEach(p => {
      expect(p).toHaveProperty('campo');
      expect(p).toHaveProperty('descripcion');
      expect(typeof p.campo).toBe('string');
      expect(typeof p.descripcion).toBe('string');
      expect(p.campo.length).toBeGreaterThan(0);
      expect(p.descripcion.length).toBeGreaterThan(0);
    });
  });
});

describe('validarPlantilla', () => {
  it('debe validar plantilla correcta', () => {
    const plantillaCorrecta = '{{pacienteNombre}} - {{servicioDestino}}';
    const resultado = validarPlantilla(plantillaCorrecta);

    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });

  it('debe detectar placeholders inválidos', () => {
    const plantillaInvalida = '{{campoInexistente}} - {{pacienteNombre}}';
    const resultado = validarPlantilla(plantillaInvalida);

    expect(resultado.valido).toBe(false);
    expect(resultado.errores.length).toBeGreaterThan(0);
    expect(resultado.errores[0]).toContain('campoInexistente');
  });

  it('debe validar secciones condicionales', () => {
    const plantillaConCondicional = '{{#antecedentesRelevantes}}Tiene antecedentes{{/antecedentesRelevantes}}';
    const resultado = validarPlantilla(plantillaConCondicional);

    expect(resultado.valido).toBe(true);
  });

  it('debe detectar secciones condicionales con campos inválidos', () => {
    const plantillaInvalida = '{{#campoInexistente}}Contenido{{/campoInexistente}}';
    const resultado = validarPlantilla(plantillaInvalida);

    expect(resultado.valido).toBe(false);
    expect(resultado.errores[0]).toContain('campoInexistente');
  });

  it('debe validar plantilla vacía como válida', () => {
    const resultado = validarPlantilla('');

    expect(resultado.valido).toBe(true);
    expect(resultado.errores).toHaveLength(0);
  });
});
