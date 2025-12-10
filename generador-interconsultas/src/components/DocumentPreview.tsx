'use client';

/**
 * Vista previa profesional del documento en formato A4
 *
 * Plantilla de informe clinico hospitalario sobrio y profesional.
 * Optimizado para impresion y aspecto de documento oficial.
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
 * Genera las iniciales del nombre del hospital
 */
function getHospitalInitials(name: string): string {
  if (!name) return 'CS';
  const words = name.split(' ').filter(w => w.length > 2 && !['de', 'del', 'la', 'el'].includes(w.toLowerCase()));
  if (words.length >= 2) {
    return (words[0][0] + words[1][0]).toUpperCase();
  }
  return name.substring(0, 2).toUpperCase();
}

/**
 * Nombres de tipos de documento
 */
const DOCUMENT_TYPE_LABELS: Record<string, string> = {
  interconsulta: 'INTERCONSULTA',
  informe_alta: 'INFORME DE ALTA',
  peticion_pruebas: 'PETICION DE PRUEBAS',
  nota_evolutiva: 'NOTA DE EVOLUCION',
  informe_social: 'INFORME SOCIAL',
};

export default function DocumentPreview({
  formData,
  plainText,
  documentType = 'interconsulta',
}: DocumentPreviewProps) {
  const [branding, setBranding] = useState<BrandingConfig | null>(null);
  const [currentDate, setCurrentDate] = useState<string>('');
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setBranding(getBranding());
    setCurrentDate(new Date().toLocaleDateString('es-ES', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    }));
    setMounted(true);
  }, []);

  // No renderizar hasta estar montado (evitar hidratacion)
  if (!mounted) {
    return (
      <div className="print-area a4-container" id="printable-document">
        <div className="bg-white border border-gray-300 min-h-[600px] flex items-center justify-center">
          <div className="animate-pulse text-gray-400 text-sm">Cargando vista previa...</div>
        </div>
      </div>
    );
  }

  const hasData = formData && (formData.paciente?.nombre || formData.informacionClinica?.motivoPrincipal);

  // Datos del documento
  const servicioDestino = formData?.servicioDestino || '';
  const prioridad = formData?.prioridad || 'Normal';
  const servicioRemitente = formData?.servicioRemitente || '';

  const paciente = formData?.paciente || {
    nombre: '',
    edad: 0,
    sexo: 'No especificado',
    identificador: '',
  };

  const infoClinica = formData?.informacionClinica || {
    motivoPrincipal: '',
    antecedentesRelevantes: '',
    exploracionDatosRelevantes: '',
    presuncionDiagnostica: '',
    tratamientoActual: '',
  };

  const medico = formData?.medico || {
    nombre: '',
    servicio: '',
    numeroColegiado: '',
    centro: '',
  };

  // Branding con defaults sobrios
  const primaryColor = branding?.colorPrincipal || '#1f2937';
  const isDark = isColorDark(primaryColor);
  const hospitalName = branding?.nombreCentro || 'Centro Sanitario';
  const hospitalSubtitle = branding?.subtitulo || '';
  const showBranding = branding?.mostrarEnDocumentos !== false;

  // Generar color mas claro para acentos (desaturado)
  const accentColor = primaryColor;

  return (
    <div className="print-area a4-container" id="printable-document">
      {/* Documento A4 - Estilo informe oficial */}
      <div className="bg-white border border-gray-300 print:border-0 print:shadow-none">

        {/* === CABECERA === */}
        <header className="border-b-2 border-gray-800 print-header">
          <div className="px-6 py-4">
            <div className="flex items-start justify-between">
              {/* Izquierda: Logo/Iniciales + Nombre Hospital */}
              <div className="flex items-center gap-3">
                {showBranding && (
                  <>
                    {branding?.logoUrl ? (
                      <img
                        src={branding.logoUrl}
                        alt=""
                        className="h-10 w-10 object-contain"
                      />
                    ) : (
                      <div
                        className="h-10 w-10 flex items-center justify-center text-sm font-bold border-2 rounded"
                        style={{
                          borderColor: primaryColor,
                          color: primaryColor,
                        }}
                      >
                        {getHospitalInitials(hospitalName)}
                      </div>
                    )}
                    <div>
                      <h1
                        className="text-base font-bold uppercase tracking-wide"
                        style={{ color: primaryColor }}
                      >
                        {hospitalName}
                      </h1>
                      {hospitalSubtitle && (
                        <p className="text-xs text-gray-500">{hospitalSubtitle}</p>
                      )}
                    </div>
                  </>
                )}
                {!showBranding && (
                  <div className="text-base font-bold uppercase tracking-wide text-gray-800">
                    Documento Clinico
                  </div>
                )}
              </div>

              {/* Derecha: Tipo documento + Fecha */}
              <div className="text-right">
                <div
                  className="text-xs font-bold uppercase tracking-wider"
                  style={{ color: primaryColor }}
                >
                  {DOCUMENT_TYPE_LABELS[documentType]}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  Fecha: {currentDate}
                </div>
              </div>
            </div>
          </div>

          {/* Barra de servicio destino + prioridad */}
          {servicioDestino && (
            <div
              className="px-6 py-2 flex items-center justify-between"
              style={{ backgroundColor: primaryColor }}
            >
              <div className={isDark ? 'text-white' : 'text-gray-900'}>
                <span className="text-xs uppercase tracking-wide opacity-80">Servicio destino: </span>
                <span className="text-sm font-semibold">{servicioDestino}</span>
              </div>

              {/* Badge prioridad */}
              <span className={`
                px-2 py-0.5 text-xs font-semibold rounded border
                ${prioridad === 'Urgente'
                  ? 'bg-red-600 text-white border-red-700'
                  : prioridad === 'Preferente'
                    ? 'bg-amber-500 text-white border-amber-600'
                    : 'bg-green-600 text-white border-green-700'
                }
              `}>
                {prioridad.toUpperCase()}
              </span>
            </div>
          )}
        </header>

        {/* === CONTENIDO === */}
        <div className="px-6 py-5 space-y-4 text-sm">

          {/* DATOS DEL PACIENTE */}
          <section>
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1 mb-2">
              Datos del Paciente
            </h2>
            <div className="grid grid-cols-4 gap-x-4 gap-y-1">
              <div>
                <span className="text-[10px] uppercase text-gray-400">Nombre/Iniciales</span>
                <p className="font-medium text-gray-900">{paciente.nombre || '—'}</p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">Edad</span>
                <p className="font-medium text-gray-900">
                  {paciente.edad ? `${paciente.edad} años` : '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">Sexo</span>
                <p className="font-medium text-gray-900">
                  {paciente.sexo !== 'No especificado' ? paciente.sexo : '—'}
                </p>
              </div>
              <div>
                <span className="text-[10px] uppercase text-gray-400">N Historia</span>
                <p className="font-medium text-gray-900">{paciente.identificador || '—'}</p>
              </div>
            </div>
          </section>

          {/* MOTIVO DE LA INTERCONSULTA */}
          {infoClinica.motivoPrincipal && (
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1 mb-2">
                Motivo de la Interconsulta
              </h2>
              <div
                className="pl-3 border-l-2 py-1"
                style={{ borderLeftColor: accentColor }}
              >
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                  {infoClinica.motivoPrincipal}
                </p>
              </div>
            </section>
          )}

          {/* ANTECEDENTES RELEVANTES */}
          {infoClinica.antecedentesRelevantes && (
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1 mb-2">
                Antecedentes Relevantes
              </h2>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {infoClinica.antecedentesRelevantes}
              </p>
            </section>
          )}

          {/* EXPLORACION Y DATOS RELEVANTES */}
          {infoClinica.exploracionDatosRelevantes && (
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1 mb-2">
                Exploracion y Datos Relevantes
              </h2>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {infoClinica.exploracionDatosRelevantes}
              </p>
            </section>
          )}

          {/* PRESUNCION DIAGNOSTICA */}
          {infoClinica.presuncionDiagnostica && (
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1 mb-2">
                Presuncion Diagnostica
              </h2>
              <div className="pl-3 border-l-2 border-amber-400 py-1 bg-amber-50 print:bg-transparent">
                <p className="text-gray-800 leading-relaxed whitespace-pre-wrap font-medium">
                  {infoClinica.presuncionDiagnostica}
                </p>
              </div>
            </section>
          )}

          {/* TRATAMIENTO ACTUAL */}
          {infoClinica.tratamientoActual && (
            <section>
              <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 border-b border-gray-200 pb-1 mb-2">
                Tratamiento Actual
              </h2>
              <p className="text-gray-800 leading-relaxed whitespace-pre-wrap">
                {infoClinica.tratamientoActual}
              </p>
            </section>
          )}

          {/* SEPARADOR */}
          <hr className="border-gray-300 my-3" />

          {/* MEDICO REMITENTE */}
          <section className="bg-gray-50 print:bg-transparent p-3 border border-gray-200">
            <h2 className="text-[11px] font-bold uppercase tracking-wider text-gray-500 mb-2">
              Medico Remitente
            </h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="font-semibold text-gray-900">{medico.nombre || '—'}</p>
                {servicioRemitente && (
                  <p className="text-xs text-gray-600">{servicioRemitente}</p>
                )}
                {medico.servicio && !servicioRemitente && (
                  <p className="text-xs text-gray-600">{medico.servicio}</p>
                )}
              </div>
              <div className="text-right text-xs text-gray-500">
                {medico.numeroColegiado && (
                  <p>N Col.: {medico.numeroColegiado}</p>
                )}
                {medico.centro && (
                  <p>{medico.centro}</p>
                )}
              </div>
            </div>
          </section>
        </div>

        {/* === PIE === */}
        <footer className="px-6 py-3 border-t border-gray-300 print-footer">
          <p className="text-[9px] text-gray-400 text-center leading-relaxed">
            Documento generado automaticamente. Requiere validacion del profesional sanitario responsable antes de su uso clinico.
          </p>
        </footer>
      </div>

      {/* Mensaje cuando no hay datos */}
      {!hasData && (
        <div className="absolute inset-0 flex items-center justify-center bg-white/90">
          <div className="text-center text-gray-400">
            <svg className="mx-auto h-12 w-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <p className="text-sm">Complete el formulario para ver la vista previa</p>
          </div>
        </div>
      )}
    </div>
  );
}
