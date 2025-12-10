/**
 * Tipos de la base de datos
 *
 * Estos tipos coinciden con el schema de Prisma (prisma/schema.prisma)
 * y se usan tanto para la implementación JSON como para Prisma.
 *
 * IMPORTANTE: Mantener sincronizados con schema.prisma
 */

// =============================================================================
// ENUMS
// =============================================================================

export type UserRole = 'SUPERADMIN' | 'ADMIN_CLINICA' | 'MEDICO';

export type Plan = 'FREE' | 'BASIC' | 'PROFESSIONAL' | 'ENTERPRISE';

export type DocumentType =
  | 'INTERCONSULTA'
  | 'INFORME_ALTA'
  | 'PETICION_PRUEBAS'
  | 'DERIVACION_PRIMARIA'
  | 'NOTA_EVOLUTIVA'
  | 'INFORME_SOCIAL';

export type WebhookEvent =
  | 'document.created'
  | 'document.enhanced'
  | 'document.printed'
  | 'document.copied'
  | 'user.login'
  | 'user.created'
  | 'user.updated'
  | 'service.created'
  | 'service.updated'
  | 'service.deleted'
  | 'template.created'
  | 'template.updated';

export type AuditAction =
  | 'document.create'
  | 'document.enhance'
  | 'document.print'
  | 'document.copy'
  | 'template.create'
  | 'template.update'
  | 'template.delete'
  | 'service.create'
  | 'service.update'
  | 'service.delete'
  | 'user.login'
  | 'user.logout'
  | 'user.create'
  | 'user.update'
  | 'webhook.trigger';

// =============================================================================
// MODELOS PRINCIPALES
// =============================================================================

export interface User {
  id: string;
  email: string;
  name: string | null;
  passwordHash: string | null;
  role: UserRole;
  clinicId: string;

  // Datos profesionales
  numeroColegiado: string | null;
  especialidad: string | null;

  // Preferencias
  preferences: string | null; // JSON

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  lastLoginAt: Date | null;
  isActive: boolean;
}

export interface Clinic {
  id: string;
  name: string;
  slug: string;

  // Datos
  nif: string | null;
  address: string | null;
  city: string | null;
  postalCode: string | null;
  phone: string | null;
  email: string | null;
  website: string | null;

  // Configuración
  settings: string; // JSON

  // Plan y límites
  plan: Plan;
  maxUsers: number;
  maxDocsMonth: number;
  aiEnabled: boolean;
  webhooksEnabled: boolean;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  isActive: boolean;
}

export interface Service {
  id: string;
  clinicId: string;
  name: string;
  category: string | null;
  description: string | null;
  sortOrder: number;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface Template {
  id: string;
  clinicId: string;
  type: DocumentType;
  name: string;
  description: string | null;
  content: string;
  fieldsConfig: string; // JSON
  isDefault: boolean;
  isActive: boolean;
  version: number;
  createdAt: Date;
  updatedAt: Date;
  createdById: string | null;
}

export interface Document {
  id: string;
  clinicId: string;
  type: DocumentType;
  templateId: string;
  formData: string; // JSON
  generatedText: string;
  enhancedText: string | null;
  createdById: string;
  wasEnhanced: boolean;
  wasPrinted: boolean;
  wasCopied: boolean;
  createdAt: Date;
}

export interface Webhook {
  id: string;
  clinicId: string;
  name: string;
  url: string;
  secret: string | null;
  headers: string | null; // JSON
  events: string; // JSON array
  isActive: boolean;
  retryCount: number;
  timeoutMs: number;
  lastTriggeredAt: Date | null;
  successCount: number;
  failureCount: number;
  lastError: string | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AuditLog {
  id: string;
  clinicId: string;
  userId: string | null;
  action: string;
  resource: string;
  resourceId: string | null;
  details: string | null; // JSON
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
}

// =============================================================================
// TIPOS DE ENTRADA (para crear/actualizar)
// =============================================================================

export type CreateUser = Omit<User, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateUser = Partial<Omit<User, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateClinic = Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateClinic = Partial<Omit<Clinic, 'id' | 'createdAt' | 'updatedAt'>>;

export type CreateService = Omit<Service, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateService = Partial<Omit<Service, 'id' | 'clinicId' | 'createdAt' | 'updatedAt'>>;

export type CreateTemplate = Omit<Template, 'id' | 'createdAt' | 'updatedAt'>;
export type UpdateTemplate = Partial<Omit<Template, 'id' | 'clinicId' | 'createdAt' | 'updatedAt'>>;

export type CreateDocument = Omit<Document, 'id' | 'createdAt'>;

export type CreateWebhook = Omit<Webhook, 'id' | 'createdAt' | 'updatedAt' | 'lastTriggeredAt' | 'successCount' | 'failureCount' | 'lastError'>;
export type UpdateWebhook = Partial<Omit<Webhook, 'id' | 'clinicId' | 'createdAt' | 'updatedAt'>>;

export type CreateAuditLog = Omit<AuditLog, 'id' | 'createdAt'>;

// =============================================================================
// TIPOS DE CONSULTA
// =============================================================================

export interface FindManyOptions<T> {
  where?: Partial<T>;
  orderBy?: { [K in keyof T]?: 'asc' | 'desc' };
  take?: number;
  skip?: number;
}

export interface FindFirstOptions<T> extends FindManyOptions<T> {}

// =============================================================================
// HELPERS
// =============================================================================

/**
 * Genera un ID único estilo cuid
 */
export function generateId(): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 15);
  return `c${timestamp}${randomPart}`;
}

/**
 * Genera un slug a partir de un nombre
 */
export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Eliminar acentos
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');
}
