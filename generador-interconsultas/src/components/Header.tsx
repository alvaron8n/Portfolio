'use client';

/**
 * Componente de cabecera de la aplicación
 *
 * Incluye navegación para diferentes tipos de documento y configuración.
 */

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';

// Tipos de documento disponibles
const documentTypes = [
  { href: '/', label: 'Interconsulta', icon: '📋', color: 'blue' },
  { href: '/documents/informe-alta', label: 'Informe de Alta', icon: '🏥', color: 'green' },
  { href: '/documents/peticion-pruebas', label: 'Petición de Pruebas', icon: '🔬', color: 'purple', disabled: true },
  { href: '/documents/nota-evolutiva', label: 'Nota Evolutiva', icon: '📝', color: 'amber', disabled: true },
  { href: '/documents/informe-social', label: 'Informe Social', icon: '👥', color: 'pink', disabled: true },
];

export default function Header() {
  const pathname = usePathname();
  const [isDocMenuOpen, setIsDocMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  // Cerrar menú al hacer clic fuera
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsDocMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Obtener el documento actual
  const currentDoc = documentTypes.find(d => d.href === pathname) || documentTypes[0];

  return (
    <header className="bg-white border-b border-gray-200 print:hidden">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo / Nombre */}
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-blue-600 to-blue-700 rounded-lg flex items-center justify-center shadow-sm">
              <svg
                className="h-6 w-6 text-white"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                />
              </svg>
            </div>
            <div className="hidden sm:block">
              <h1 className="text-lg font-bold text-gray-900">
                MediDocs
              </h1>
              <p className="text-xs text-gray-500">
                Documentación médica
              </p>
            </div>
          </Link>

          {/* Navegación */}
          <nav className="flex items-center gap-2">
            {/* Selector de tipo de documento */}
            <div className="relative" ref={menuRef}>
              <button
                onClick={() => setIsDocMenuOpen(!isDocMenuOpen)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  pathname === '/' || pathname.startsWith('/documents')
                    ? 'bg-blue-50 text-blue-700'
                    : 'text-gray-600 hover:bg-gray-100'
                }`}
              >
                <span>{currentDoc.icon}</span>
                <span className="hidden sm:inline">{currentDoc.label}</span>
                <svg
                  className={`w-4 h-4 transition-transform ${isDocMenuOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Dropdown menu */}
              {isDocMenuOpen && (
                <div className="absolute right-0 mt-2 w-64 bg-white rounded-xl shadow-lg border border-gray-200 py-2 z-50">
                  <div className="px-3 py-2 border-b border-gray-100">
                    <p className="text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tipo de documento
                    </p>
                  </div>
                  {documentTypes.map(doc => (
                    <Link
                      key={doc.href}
                      href={doc.disabled ? '#' : doc.href}
                      onClick={(e) => {
                        if (doc.disabled) {
                          e.preventDefault();
                        } else {
                          setIsDocMenuOpen(false);
                        }
                      }}
                      className={`flex items-center gap-3 px-3 py-2 text-sm transition-colors ${
                        doc.disabled
                          ? 'text-gray-400 cursor-not-allowed'
                          : pathname === doc.href
                          ? 'bg-blue-50 text-blue-700'
                          : 'text-gray-700 hover:bg-gray-50'
                      }`}
                    >
                      <span className="text-lg">{doc.icon}</span>
                      <div className="flex-1">
                        <span className="block font-medium">{doc.label}</span>
                        {doc.disabled && (
                          <span className="text-xs text-gray-400">Próximamente</span>
                        )}
                      </div>
                      {pathname === doc.href && (
                        <svg className="w-4 h-4 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* Configuración */}
            <Link
              href="/configuracion"
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                pathname === '/configuracion'
                  ? 'bg-blue-50 text-blue-700'
                  : 'text-gray-600 hover:bg-gray-100 hover:text-gray-900'
              }`}
            >
              <span className="hidden sm:inline">Configuración</span>
              <svg
                className="w-5 h-5 sm:hidden"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
                />
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
                />
              </svg>
            </Link>
          </nav>
        </div>
      </div>
    </header>
  );
}
