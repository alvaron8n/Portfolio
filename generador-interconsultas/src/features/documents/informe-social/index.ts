/**
 * Feature: Informe Social Sanitario
 *
 * Exporta todos los componentes y utilidades para informes de trabajo social.
 */

export { default as InformeSocialForm } from './InformeSocialForm';
export {
  informeSocialSchema,
  informeSocialInitialValues,
  informeSocialPlaceholders,
  informeSocialDefaultTemplate,
  flattenInformeSocialData,
  RECURSOS_SOCIALES,
  TIPOS_CONVIVENCIA,
} from './schema';
export type { InformeSocialFormData } from './schema';
