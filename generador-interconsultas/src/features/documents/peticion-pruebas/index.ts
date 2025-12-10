/**
 * Feature: Petición de Pruebas Diagnósticas
 *
 * Exporta todos los componentes y utilidades para la petición de pruebas.
 */

export { default as PeticionPruebasForm } from './PeticionPruebasForm';
export {
  peticionPruebasSchema,
  peticionPruebasInitialValues,
  peticionPruebasPlaceholders,
  peticionPruebasDefaultTemplate,
  flattenPeticionPruebasData,
  TIPOS_PRUEBAS_LABORATORIO,
  TIPOS_PRUEBAS_IMAGEN,
  TIPOS_PRUEBAS_FUNCIONALES,
} from './schema';
export type { PeticionPruebasFormData } from './schema';
