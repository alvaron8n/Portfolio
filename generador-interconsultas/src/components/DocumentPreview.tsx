'use client';

/**
 * Vista previa profesional del documento en formato HTML
 *
 * Renderiza el texto de interconsulta como un documento médico
 * con formato profesional tipo A4, listo para imprimir o exportar.
 */

import { InterconsultaFormData } from '@/types';

interface DocumentPreviewProps {
  /** Datos del formulario para renderizar */
  formData?: InterconsultaFormData;
  /** Texto plano generado (alternativa a formData) */
  plainText?: string;
  /** Tipo de documento */
  documentType?: 'interconsulta' | 'informe_alta' | 'peticion_pruebas';
}

/**
 * Parsea el texto plano y extrae las secciones
 */
function parseDocumentSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};

  // Extraer secciones principales por separadores
  const parts = text.split(/─{10,}/);

  if (parts.length > 0) {
    // Primera parte: header
    const headerMatch = parts[0].match(/INTERCONSULTA AL SERVICIO DE\s+(.+)/);
    if (headerMatch) sections.servicioDestino = headerMatch[1].trim();

    const prioridadMatch = parts[0].match(/Prioridad:\s*(.+)/);
    if (prioridadMatch) sections.prioridad = prioridadMatch[1].trim();

    const fechaMatch = parts[0].match(/Fecha:\s*(.+)/);
    if (fechaMatch) sections.fecha = fechaMatch[1].trim();
  }

  // Buscar secciones por título
  const sectionTitles = [
    'DATOS DEL PACIENTE',
    'MOTIVO DE LA INTERCONSULTA',
    'ANTECEDENTES RELEVANTES',
    'EXPLORACIÓN Y DATOS RELEVANTES',
    'PRESUNCIÓN DIAGNÓSTICA',
    'TRATAMIENTO ACTUAL',
    'MÉDICO REMITENTE',
  ];

  sectionTitles.forEach(title => {
    const regex = new RegExp(`${title}\\s*\\n\\n([\\s\\S]*?)(?=\\n\\n[A-ZÁÉÍÓÚ]|$)`, 'm');
    const match = text.match(regex);
    if (match) {
      const key = title.toLowerCase().replace(/\s+/g, '_').replace(/[áéíóú]/g, c =>
        ({ 'á': 'a', 'é': 'e', 'í': 'i', 'ó': 'o', 'ú': 'u' }[c] || c)
      );
      sections[key] = match[1].trim();
    }
  });

  return sections;
}

export default function DocumentPreview({
  formData,
  plainText,
  documentType = 'interconsulta',
}: DocumentPreviewProps) {
  // Si tenemos formData, usarlo directamente; si no, parsear plainText
  const hasFormData = formData && formData.paciente?.nombre;

  // Parsear texto plano para extraer información
  const parsedSections = plainText ? parseDocumentSections(plainText) : {};

  // Determinar los valores a mostrar
  const servicioDestino = hasFormData ? formData.servicioDestino : parsedSections.servicioDestino || '';
  const prioridad = hasFormData ? formData.prioridad : parsedSections.prioridad || '';
  const fecha = parsedSections.fecha || new Date().toLocaleDateString('es-ES');

  const paciente = hasFormData ? formData.paciente : {
    nombre: parsedSections.datos_del_paciente?.match(/Nombre\/Iniciales:\s*(.+)/)?.[1] || '',
    edad: parseInt(parsedSections.datos_del_paciente?.match(/Edad:\s*(\d+)/)?.[1] || '0'),
    sexo: parsedSections.datos_del_paciente?.match(/Sexo:\s*(.+)/)?.[1] || '',
    identificador: parsedSections.datos_del_paciente?.match(/Nº Historia Clínica:\s*(.+)/)?.[1] || '',
  };

  const infoClinica = hasFormData ? formData.informacionClinica : {
    motivoPrincipal: parsedSections.motivo_de_la_interconsulta || '',
    antecedentesRelevantes: parsedSections.antecedentes_relevantes || '',
    exploracionDatosRelevantes: parsedSections.exploracion_y_datos_relevantes || '',
    presuncionDiagnostica: parsedSections.presuncion_diagnostica || '',
    tratamientoActual: parsedSections.tratamiento_actual || '',
  };

  const medico = hasFormData ? formData.medico : {
    nombre: '',
    servicio: formData?.servicioRemitente || '',
    numeroColegiado: '',
    centro: '',
  };

  const servicioRemitente = hasFormData ? formData.servicioRemitente : '';

  // Color de prioridad con soporte dark mode
  const prioridadStyles = {
    'Urgente': 'bg-red-100 text-red-800 border-red-300 dark:bg-red-900/50 dark:text-red-300 dark:border-red-700',
    'Preferente': 'bg-amber-100 text-amber-800 border-amber-300 dark:bg-amber-900/50 dark:text-amber-300 dark:border-amber-700',
    'Normal': 'bg-green-100 text-green-800 border-green-300 dark:bg-green-900/50 dark:text-green-300 dark:border-green-700',
  }[prioridad] || 'bg-gray-100 text-gray-800 border-gray-300 dark:bg-gray-700 dark:text-gray-300 dark:border-gray-600';

  return (
    <div className="flex justify-center px-2 sm:px-0">
      {/* Contenedor tipo A4 centrado */}
      <div className="w-full max-w-[800px] bg-white dark:bg-slate-900 shadow-lg border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden
        print:max-w-none print:w-[210mm] print:min-h-[297mm] print:shadow-none print:border-none print:rounded-none print:bg-white">

        {/* Encabezado del documento */}
        <header className="bg-gradient-to-r from-blue-600 to-blue-700 dark:from-blue-800 dark:to-blue-900 text-white px-4 sm:px-6 py-4 sm:py-5 print:bg-blue-600 print:py-4 print:px-8">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
            <div className="flex-1 min-w-0">
              <p className="text-[10px] sm:text-xs font-semibold tracking-widest uppercase text-blue-200 dark:text-blue-300 mb-1">
                {documentType === 'interconsulta' ? 'Interconsulta Médica' :
                 documentType === 'informe_alta' ? 'Informe de Alta' : 'Petición de Pruebas'}
              </p>
              <h1 className="text-lg sm:text-xl font-bold leading-tight truncate">
                {servicioDestino ? `Servicio de ${servicioDestino}` : 'Documento Médico'}
              </h1>
              {medico.centro && (
                <p className="text-xs sm:text-sm text-blue-200 dark:text-blue-300 mt-1 truncate">{medico.centro}</p>
              )}
            </div>
            <div className="flex sm:flex-col items-center sm:items-end gap-2 sm:gap-1 shrink-0">
              <p className="text-xs sm:text-sm text-blue-200 dark:text-blue-300">{fecha}</p>
              {prioridad && (
                <span className={`inline-block px-2.5 sm:px-3 py-0.5 sm:py-1 rounded-full text-[10px] sm:text-xs font-semibold border ${prioridadStyles}`}>
                  {prioridad}
                </span>
              )}
            </div>
          </div>
        </header>

        {/* Contenido del documento */}
        <div className="p-4 sm:p-6 space-y-4 sm:space-y-5 print:p-8 print:space-y-4">

          {/* Datos del Paciente */}
          <section>
            <h2 className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 sm:gap-2">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Datos del Paciente
            </h2>
            <div className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 sm:p-4 grid grid-cols-2 sm:grid-cols-4 gap-2 sm:gap-3 print:bg-gray-50">
              <div>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Nombre/Iniciales</p>
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{paciente.nombre || '-'}</p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Edad</p>
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{paciente.edad ? `${paciente.edad} años` : '-'}</p>
              </div>
              <div>
                <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Sexo</p>
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{paciente.sexo || '-'}</p>
              </div>
              {paciente.identificador && (
                <div>
                  <p className="text-[9px] sm:text-[10px] uppercase tracking-wide text-slate-400 dark:text-slate-500">Nº Historia</p>
                  <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200 leading-relaxed">{paciente.identificador}</p>
                </div>
              )}
            </div>
          </section>

          {/* Motivo de la Interconsulta */}
          {infoClinica.motivoPrincipal && (
            <section>
              <h2 className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 sm:gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Motivo de la Interconsulta
              </h2>
              <div className="bg-blue-50 dark:bg-blue-900/20 border-l-4 border-blue-500 dark:border-blue-400 p-3 sm:p-4 rounded-r-lg print:bg-blue-50">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{infoClinica.motivoPrincipal}</p>
              </div>
            </section>
          )}

          {/* Antecedentes Relevantes */}
          {infoClinica.antecedentesRelevantes && (
            <section>
              <h2 className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2">
                Antecedentes Relevantes
              </h2>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-lg print:bg-gray-50">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{infoClinica.antecedentesRelevantes}</p>
              </div>
            </section>
          )}

          {/* Exploración y Datos Relevantes */}
          {infoClinica.exploracionDatosRelevantes && (
            <section>
              <h2 className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2">
                Exploración y Datos Relevantes
              </h2>
              <div className="bg-slate-50 dark:bg-slate-800/50 p-3 sm:p-4 rounded-lg print:bg-gray-50">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{infoClinica.exploracionDatosRelevantes}</p>
              </div>
            </section>
          )}

          {/* Presunción Diagnóstica */}
          {infoClinica.presuncionDiagnostica && (
            <section>
              <h2 className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 sm:gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Presunción Diagnóstica
              </h2>
              <div className="bg-amber-50 dark:bg-amber-900/20 border-l-4 border-amber-500 dark:border-amber-400 p-3 sm:p-4 rounded-r-lg print:bg-amber-50">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{infoClinica.presuncionDiagnostica}</p>
              </div>
            </section>
          )}

          {/* Tratamiento Actual */}
          {infoClinica.tratamientoActual && (
            <section>
              <h2 className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2 flex items-center gap-1.5 sm:gap-2">
                <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Tratamiento Actual
              </h2>
              <div className="bg-green-50 dark:bg-green-900/20 border-l-4 border-green-500 dark:border-green-400 p-3 sm:p-4 rounded-r-lg print:bg-green-50">
                <p className="text-xs sm:text-sm leading-relaxed text-slate-800 dark:text-slate-200 whitespace-pre-wrap">{infoClinica.tratamientoActual}</p>
              </div>
            </section>
          )}

          {/* Separador */}
          <hr className="border-slate-200 dark:border-slate-700 my-3 sm:my-4 print:border-gray-300" />

          {/* Médico Remitente */}
          <section className="bg-slate-50 dark:bg-slate-800/50 rounded-lg p-3 sm:p-4 print:bg-gray-50">
            <h2 className="text-[10px] sm:text-xs font-semibold tracking-wide uppercase text-slate-500 dark:text-slate-400 mb-2 sm:mb-3 flex items-center gap-1.5 sm:gap-2">
              <svg className="w-3.5 h-3.5 sm:w-4 sm:h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Médico Remitente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
              <div>
                <p className="text-xs sm:text-sm font-medium text-slate-800 dark:text-slate-200">{medico.nombre || '-'}</p>
                {servicioRemitente && (
                  <p className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400">{servicioRemitente}</p>
                )}
              </div>
              <div className="text-[10px] sm:text-xs text-slate-500 dark:text-slate-400 space-y-0.5">
                {medico.numeroColegiado && (
                  <p>Nº Colegiado: {medico.numeroColegiado}</p>
                )}
                {medico.centro && (
                  <p>{medico.centro}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* Pie del documento */}
        <footer className="px-4 sm:px-6 py-3 sm:py-4 border-t border-slate-200 dark:border-slate-700 bg-slate-50 dark:bg-slate-800/30 print:bg-white print:border-gray-300 print:px-8">
          <p className="text-[9px] sm:text-[10px] text-slate-400 dark:text-slate-500 text-center italic leading-relaxed">
            Este documento es un borrador generado automáticamente.
            Debe ser revisado y validado por el profesional sanitario antes de su uso.
            No constituye un documento clínico oficial hasta su validación.
          </p>
        </footer>
      </div>
    </div>
  );
}
