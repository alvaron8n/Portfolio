/**
 * Feature: Nota Evolutiva (SOAP)
 *
 * Exporta todos los componentes y utilidades para notas de evolución clínica.
 */

export { default as NotaEvolutivaForm } from './NotaEvolutivaForm';
export {
  notaEvolutivaSchema,
  notaEvolutivaInitialValues,
  notaEvolutivaPlaceholders,
  notaEvolutivaDefaultTemplate,
  flattenNotaEvolutivaData,
  ESTADOS_GENERALES,
  CONSTANTES_EJEMPLO,
} from './schema';
export type { NotaEvolutivaFormData } from './schema';
