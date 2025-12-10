'use client';

/**
 * Componente de aviso legal obligatorio
 *
 * Muestra el disclaimer legal que debe estar siempre visible
 * según los requisitos éticos y legales del producto.
 */

interface LegalDisclaimerProps {
  variant?: 'banner' | 'compact';
}

export default function LegalDisclaimer({ variant = 'banner' }: LegalDisclaimerProps) {
  if (variant === 'compact') {
    return (
      <p className="text-xs text-gray-500 italic">
        Este sistema genera borradores. El contenido debe ser revisado y validado
        por el médico responsable.
      </p>
    );
  }

  return (
    <div className="bg-amber-50 border border-amber-200 rounded-lg p-4">
      <div className="flex items-start gap-3">
        <svg
          className="h-5 w-5 text-amber-600 mt-0.5 flex-shrink-0"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
          />
        </svg>
        <div>
          <p className="text-sm text-amber-800 font-medium">
            Aviso importante
          </p>
          <p className="mt-1 text-sm text-amber-700">
            Este sistema genera <strong>borradores de interconsulta</strong>.
            El contenido debe ser <strong>revisado y validado</strong> por el
            médico responsable antes de su uso. La decisión clínica recae
            siempre en el profesional sanitario.
          </p>
        </div>
      </div>
    </div>
  );
}
