'use client';

/**
 * Vista previa profesional del documento en formato A4
 *
 * Renderiza el documento médico con formato hospitalario profesional,
 * integrando el branding del centro y preparado para impresión.
 */

import { useEffect, useState } from 'react';
import { InterconsultaFormData } from '@/types';
import { getBranding, BrandingConfig, isColorDark } from '@/lib/branding';

interface DocumentPreviewProps {
  formData?: InterconsultaFormData;
  plainText?: string;
  documentType?: 'interconsulta' | 'informe_alta' | 'peticion_pruebas' | 'nota_evolutiva' | 'informe_social';
}

/**
 * Parsea el texto plano y extrae las secciones
 */
function parseDocumentSections(text: string): Record<string, string> {
  const sections: Record<string, string> = {};

  const parts = text.split(/─{10,}/);

  if (parts.length > 0) {
    const headerMatch = parts[0].match(/INTERCONSULTA AL SERVICIO DE\s+(.+)/);
    if (headerMatch) sections.servicioDestino = headerMatch[1].trim();

    const prioridadMatch = parts[0].match(/Prioridad:\s*(.+)/);
    if (prioridadMatch) sections.prioridad = prioridadMatch[1].trim();

    const fechaMatch = parts[0].match(/Fecha:\s*(.+)/);
    if (fechaMatch) sections.fecha = fechaMatch[1].trim();
  }

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

/**
 * Genera las iniciales del nombre del hospital
 */
function getHospitalInitials(name: string): string {
  if (!name) return 'HC';
  const words = name.split(' ').filter(w => w.length > 2);
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Nombres legibles de tipos de documento
 */
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  interconsulta: 'Interconsulta Médica',
  informe_alta: 'Informe de Alta',
  peticion_pruebas: 'Petición de Pruebas Diagnósticas',
  nota_evolutiva: 'Nota de Evolución',
  informe_social: 'Informe Social',
};

export default function DocumentPreview({
  formData,
  plainText,
  documentType = 'interconsulta',
}: DocumentPreviewProps) {
  // Cargar branding en cliente para evitar hidratación
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    setBranding(getBranding());
    setCurrentDate(new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    }));
  }, []);

  const hasFormData = formData && formData.paciente?.nombre;
  const parsedSections = plainText ? parseDocumentSections(plainText) : {};

  // Datos del documento
  const servicioDestino = hasFormData ? formData.servicioDestino : parsedSections.servicioDestino || '';
  const prioridad = hasFormData ? formData.prioridad : parsedSections.prioridad || '';
  const fecha = parsedSections.fecha || currentDate;

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

  // Colores y estilos
  const primaryColor = branding?.colorPrincipal || '#1e40af';
  const isDark = isColorDark(primaryColor);
  const hospitalName = branding?.nombreCentro || 'Hospital Clínico';
  const hospitalSubtitle = branding?.subtitulo || 'Servicio de Documentación Clínica';
  const showBrandingInDoc = branding?.mostrarEnDocumentos !== false;

  // Badge de prioridad
  const prioridadConfig = {
    'Urgente': { bg: 'bg-red-100', text: 'text-red-800', border: 'border-red-300' },
    'Preferente': { bg: 'bg-amber-100', text: 'text-amber-800', border: 'border-amber-300' },
    'Normal': { bg: 'bg-green-100', text: 'text-green-800', border: 'border-green-300' },
  }[prioridad] || { bg: 'bg-gray-100', text: 'text-gray-800', border: 'border-gray-300' };

  return (
    <div className="print-area a4-container" id="printable-document">
      {/* Documento A4 */}
      <div className="bg-white shadow-lg border border-gray-200 rounded-lg overflow-hidden">
        {/* ====== CABECERA HOSPITALARIA ====== */}
        <header
          className="px-6 py-5 text-white print-header"
          style={{ backgroundColor: primaryColor }}
        >
          <div className="flex items-start justify-between gap-4">
            {/* Logo + Info del hospital */}
            <div className="flex items-center gap-4">
              {/* Logo o Iniciales */}
              {showBrandingInDoc && (
                <div
                  className={`w-14 h-14 rounded-lg flex items-center justify-center font-bold text-xl ${
                    isDark ? 'bg-white/20' : 'bg-black/10'
                  }`}
                >
                  {branding?.logoUrl ? (
                    <img
                      src={branding.logoUrl}
                      alt=""
                      className="w-12 h-12 object-contain rounded"
                    />
                  ) : (
                    <span className={isDark ? 'text-white' : 'text-gray-900'}>
                      {getHospitalInitials(hospitalName)}
                    </span>
                  )}
                </div>
              )}

              <div>
                {showBrandingInDoc && (
                  <>
                    <h1 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                      {hospitalName}
                    </h1>
                    <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                      {hospitalSubtitle}
                    </p>
                  </>
                )}
                <p className={`text-xs mt-1 uppercase tracking-wider font-semibold ${isDark ? 'text-white/70' : 'text-gray-600'}`}>
                  {DOCUMENT_TYPE_LABELS[documentType] || 'Documento Clínico'}
                </p>
              </div>
            </div>

            {/* Fecha y Prioridad */}
            <div className="text-right shrink-0">
              <p className={`text-sm ${isDark ? 'text-white/80' : 'text-gray-700'}`}>
                {fecha}
              </p>
              {prioridad && (
                <span className={`inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold border ${prioridadConfig.bg} ${prioridadConfig.text} ${prioridadConfig.border}`}>
                  {prioridad}
                </span>
              )}
            </div>
          </div>

          {/* Servicio destino */}
          {servicioDestino && (
            <div className={`mt-4 pt-4 border-t ${isDark ? 'border-white/20' : 'border-black/10'}`}>
              <p className={`text-xs uppercase tracking-wider ${isDark ? 'text-white/60' : 'text-gray-600'}`}>
                Servicio Destino
              </p>
              <p className={`text-xl font-semibold ${isDark ? 'text-white' : 'text-gray-900'}`}>
                {servicioDestino}
              </p>
            </div>
          )}
        </header>

        {/* ====== CONTENIDO DEL DOCUMENTO ====== */}
        <div className="p-6 space-y-5">
          {/* Datos del Paciente */}
          <section>
            <h2 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Datos del Paciente
            </h2>
            <div className="bg-gray-50 rounded-lg p-4 grid grid-cols-2 sm:grid-cols-4 gap-4">
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Nombre/Iniciales</p>
                <p className="text-sm font-medium text-gray-900">{paciente.nombre || '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Edad</p>
                <p className="text-sm font-medium text-gray-900">{paciente.edad ? `${paciente.edad} años` : '-'}</p>
              </div>
              <div>
                <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">Sexo</p>
                <p className="text-sm font-medium text-gray-900">{paciente.sexo || '-'}</p>
              </div>
              {paciente.identificador && (
                <div>
                  <p className="text-[10px] uppercase tracking-wide text-gray-400 mb-0.5">N Historia</p>
                  <p className="text-sm font-medium text-gray-900">{paciente.identificador}</p>
                </div>
              )}
            </div>
          </section>

          {/* Motivo de la Interconsulta */}
          {infoClinica.motivoPrincipal && (
            <section>
              <h2 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Motivo de la Interconsulta
              </h2>
              <div
                className="bg-blue-50 border-l-4 p-4 rounded-r-lg"
                style={{ borderLeftColor: primaryColor }}
              >
                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {infoClinica.motivoPrincipal}
                </p>
              </div>
            </section>
          )}

          {/* Antecedentes Relevantes */}
          {infoClinica.antecedentesRelevantes && (
            <section>
              <h2 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-3">
                Antecedentes Relevantes
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {infoClinica.antecedentesRelevantes}
                </p>
              </div>
            </section>
          )}

          {/* Exploración y Datos Relevantes */}
          {infoClinica.exploracionDatosRelevantes && (
            <section>
              <h2 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-3">
                Exploración y Datos Relevantes
              </h2>
              <div className="bg-gray-50 p-4 rounded-lg">
                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {infoClinica.exploracionDatosRelevantes}
                </p>
              </div>
            </section>
          )}

          {/* Presunción Diagnóstica */}
          {infoClinica.presuncionDiagnostica && (
            <section>
              <h2 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                Presunción Diagnóstica
              </h2>
              <div className="bg-amber-50 border-l-4 border-amber-500 p-4 rounded-r-lg">
                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {infoClinica.presuncionDiagnostica}
                </p>
              </div>
            </section>
          )}

          {/* Tratamiento Actual */}
          {infoClinica.tratamientoActual && (
            <section>
              <h2 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-3 flex items-center gap-2">
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547M8 4h8l-1 1v5.172a2 2 0 00.586 1.414l5 5c1.26 1.26.367 3.414-1.415 3.414H4.828c-1.782 0-2.674-2.154-1.414-3.414l5-5A2 2 0 009 10.172V5L8 4z" />
                </svg>
                Tratamiento Actual
              </h2>
              <div className="bg-green-50 border-l-4 border-green-500 p-4 rounded-r-lg">
                <p className="text-sm leading-relaxed text-gray-800 whitespace-pre-wrap">
                  {infoClinica.tratamientoActual}
                </p>
              </div>
            </section>
          )}

          {/* Separador */}
          <hr className="border-gray-200 my-4" />

          {/* Médico Remitente */}
          <section className="bg-gray-50 rounded-lg p-4">
            <h2 className="text-xs font-semibold tracking-wider uppercase text-gray-500 mb-3 flex items-center gap-2">
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Médico Remitente
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <p className="text-sm font-medium text-gray-900">{medico.nombre || '-'}</p>
                {servicioRemitente && (
                  <p className="text-xs text-gray-500">{servicioRemitente}</p>
                )}
              </div>
              <div className="text-xs text-gray-500 space-y-0.5">
                {medico.numeroColegiado && (
                  <p>N Colegiado: {medico.numeroColegiado}</p>
                )}
                {medico.centro && (
                  <p>{medico.centro}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* ====== PIE DEL DOCUMENTO ====== */}
        <footer className="px-6 py-4 border-t border-gray-200 bg-gray-50 print-footer">
          <p className="text-[10px] text-gray-400 text-center italic leading-relaxed">
            Este documento es un borrador generado automaticamente.
            Debe ser revisado y validado por el profesional sanitario antes de su uso.
            No constituye un documento clinico oficial hasta su validacion.
          </p>
        </footer>
      </div>
    </div>
  );
}
