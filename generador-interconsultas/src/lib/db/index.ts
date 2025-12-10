/**
 * Módulo de base de datos
 *
 * Exporta el cliente de base de datos, tipos y utilidades.
 *
 * Uso:
 *   import { db, Service, CreateService } from '@/lib/db';
 *
 *   const services = await db.client.findServicesByClinic(clinicId);
 */

// Cliente de base de datos
export { db, getDbClient, type DbClient } from './client';

// Tipos
export * from './types';

// Re-exportar tipos comunes para conveniencia
export type {
  User,
  Clinic,
  Service,
  Template,
  Document,
  Webhook,
  AuditLog,
  UserRole,
  Plan,
  DocumentType,
  WebhookEvent,
  AuditAction,
} from './types';
