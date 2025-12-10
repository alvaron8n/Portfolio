/**
 * Cliente de base de datos
 *
 * Este módulo proporciona una abstracción sobre la capa de persistencia.
 * Actualmente usa JSON/FileSystem, pero está diseñado para migrar fácilmente a Prisma.
 *
 * PARA MIGRAR A PRISMA:
 * 1. Instalar @prisma/client y ejecutar prisma generate
 * 2. Cambiar USE_PRISMA a true
 * 3. Descomentar el import de PrismaClient
 *
 * El resto del código de la aplicación no necesita cambios.
 */

import { promises as fs } from 'fs';
import path from 'path';
import {
  User,
  Clinic,
  Service,
  Template,
  Document,
  Webhook,
  AuditLog,
  CreateUser,
  UpdateUser,
  CreateClinic,
  UpdateClinic,
  CreateService,
  UpdateService,
  CreateTemplate,
  UpdateTemplate,
  CreateDocument,
  CreateWebhook,
  UpdateWebhook,
  CreateAuditLog,
  generateId,
  DocumentType,
} from './types';

// =============================================================================
// CONFIGURACIÓN
// =============================================================================

// Cambiar a true cuando Prisma esté disponible
const USE_PRISMA = false;

// Ruta al archivo de base de datos JSON
const DB_DIR = path.join(process.cwd(), 'data');
const DB_FILE = path.join(DB_DIR, 'database.json');

// =============================================================================
// ESTRUCTURA DE LA BASE DE DATOS JSON
// =============================================================================

interface DatabaseSchema {
  users: User[];
  clinics: Clinic[];
  services: Service[];
  templates: Template[];
  documents: Document[];
  webhooks: Webhook[];
  auditLogs: AuditLog[];
  _metadata: {
    version: string;
    lastUpdated: string;
  };
}

const EMPTY_DATABASE: DatabaseSchema = {
  users: [],
  clinics: [],
  services: [],
  templates: [],
  documents: [],
  webhooks: [],
  auditLogs: [],
  _metadata: {
    version: '1.0.0',
    lastUpdated: new Date().toISOString(),
  },
};

// =============================================================================
// OPERACIONES DE ARCHIVO
// =============================================================================

async function ensureDbDir(): Promise<void> {
  try {
    await fs.access(DB_DIR);
  } catch {
    await fs.mkdir(DB_DIR, { recursive: true });
  }
}

async function readDatabase(): Promise<DatabaseSchema> {
  await ensureDbDir();
  try {
    const data = await fs.readFile(DB_FILE, 'utf-8');
    return JSON.parse(data, (key, value) => {
      // Convertir strings de fecha a objetos Date
      if (key.endsWith('At') || key === 'createdAt' || key === 'updatedAt') {
        return value ? new Date(value) : null;
      }
      return value;
    });
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === 'ENOENT') {
      // Crear base de datos vacía si no existe
      await writeDatabase(EMPTY_DATABASE);
      return EMPTY_DATABASE;
    }
    throw error;
  }
}

async function writeDatabase(data: DatabaseSchema): Promise<void> {
  await ensureDbDir();
  data._metadata.lastUpdated = new Date().toISOString();
  await fs.writeFile(DB_FILE, JSON.stringify(data, null, 2), 'utf-8');
}

// =============================================================================
// CLIENTE JSON (implementación actual)
// =============================================================================

class JsonDatabaseClient {
  // ---------------------------------------------------------------------------
  // CLINICS
  // ---------------------------------------------------------------------------

  async findClinic(id: string): Promise<Clinic | null> {
    const db = await readDatabase();
    return db.clinics.find((c) => c.id === id) || null;
  }

  async findClinicBySlug(slug: string): Promise<Clinic | null> {
    const db = await readDatabase();
    return db.clinics.find((c) => c.slug === slug) || null;
  }

  async findAllClinics(): Promise<Clinic[]> {
    const db = await readDatabase();
    return db.clinics.filter((c) => c.isActive);
  }

  async createClinic(data: CreateClinic): Promise<Clinic> {
    const db = await readDatabase();
    const clinic: Clinic = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.clinics.push(clinic);
    await writeDatabase(db);
    return clinic;
  }

  async updateClinic(id: string, data: UpdateClinic): Promise<Clinic | null> {
    const db = await readDatabase();
    const index = db.clinics.findIndex((c) => c.id === id);
    if (index === -1) return null;

    db.clinics[index] = {
      ...db.clinics[index],
      ...data,
      updatedAt: new Date(),
    };
    await writeDatabase(db);
    return db.clinics[index];
  }

  // ---------------------------------------------------------------------------
  // USERS
  // ---------------------------------------------------------------------------

  async findUser(id: string): Promise<User | null> {
    const db = await readDatabase();
    return db.users.find((u) => u.id === id) || null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    const db = await readDatabase();
    return db.users.find((u) => u.email === email) || null;
  }

  async findUsersByClinic(clinicId: string): Promise<User[]> {
    const db = await readDatabase();
    return db.users.filter((u) => u.clinicId === clinicId && u.isActive);
  }

  async createUser(data: CreateUser): Promise<User> {
    const db = await readDatabase();
    const user: User = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.users.push(user);
    await writeDatabase(db);
    return user;
  }

  async updateUser(id: string, data: UpdateUser): Promise<User | null> {
    const db = await readDatabase();
    const index = db.users.findIndex((u) => u.id === id);
    if (index === -1) return null;

    db.users[index] = {
      ...db.users[index],
      ...data,
      updatedAt: new Date(),
    };
    await writeDatabase(db);
    return db.users[index];
  }

  // ---------------------------------------------------------------------------
  // SERVICES
  // ---------------------------------------------------------------------------

  async findService(id: string, clinicId: string): Promise<Service | null> {
    const db = await readDatabase();
    return db.services.find((s) => s.id === id && s.clinicId === clinicId) || null;
  }

  async findServicesByClinic(clinicId: string, includeInactive = false): Promise<Service[]> {
    const db = await readDatabase();
    return db.services
      .filter((s) => s.clinicId === clinicId && (includeInactive || s.isActive))
      .sort((a, b) => a.sortOrder - b.sortOrder);
  }

  async createService(data: CreateService): Promise<Service> {
    const db = await readDatabase();
    const service: Service = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.services.push(service);
    await writeDatabase(db);
    return service;
  }

  async updateService(id: string, clinicId: string, data: UpdateService): Promise<Service | null> {
    const db = await readDatabase();
    const index = db.services.findIndex((s) => s.id === id && s.clinicId === clinicId);
    if (index === -1) return null;

    db.services[index] = {
      ...db.services[index],
      ...data,
      updatedAt: new Date(),
    };
    await writeDatabase(db);
    return db.services[index];
  }

  async deleteService(id: string, clinicId: string): Promise<boolean> {
    const db = await readDatabase();
    const index = db.services.findIndex((s) => s.id === id && s.clinicId === clinicId);
    if (index === -1) return false;

    // Soft delete
    db.services[index].isActive = false;
    db.services[index].updatedAt = new Date();
    await writeDatabase(db);
    return true;
  }

  // ---------------------------------------------------------------------------
  // TEMPLATES
  // ---------------------------------------------------------------------------

  async findTemplate(id: string, clinicId: string): Promise<Template | null> {
    const db = await readDatabase();
    return db.templates.find((t) => t.id === id && t.clinicId === clinicId) || null;
  }

  async findTemplateByType(type: DocumentType, clinicId: string): Promise<Template | null> {
    const db = await readDatabase();
    return (
      db.templates.find(
        (t) => t.type === type && t.clinicId === clinicId && t.isActive && t.isDefault
      ) ||
      db.templates.find((t) => t.type === type && t.clinicId === clinicId && t.isActive) ||
      null
    );
  }

  async findTemplatesByClinic(clinicId: string): Promise<Template[]> {
    const db = await readDatabase();
    return db.templates.filter((t) => t.clinicId === clinicId && t.isActive);
  }

  async findTemplatesByType(type: DocumentType, clinicId: string): Promise<Template[]> {
    const db = await readDatabase();
    return db.templates.filter((t) => t.type === type && t.clinicId === clinicId && t.isActive);
  }

  async createTemplate(data: CreateTemplate): Promise<Template> {
    const db = await readDatabase();
    const template: Template = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.templates.push(template);
    await writeDatabase(db);
    return template;
  }

  async updateTemplate(id: string, clinicId: string, data: UpdateTemplate): Promise<Template | null> {
    const db = await readDatabase();
    const index = db.templates.findIndex((t) => t.id === id && t.clinicId === clinicId);
    if (index === -1) return null;

    db.templates[index] = {
      ...db.templates[index],
      ...data,
      version: db.templates[index].version + 1,
      updatedAt: new Date(),
    };
    await writeDatabase(db);
    return db.templates[index];
  }

  // ---------------------------------------------------------------------------
  // DOCUMENTS
  // ---------------------------------------------------------------------------

  async findDocument(id: string, clinicId: string): Promise<Document | null> {
    const db = await readDatabase();
    return db.documents.find((d) => d.id === id && d.clinicId === clinicId) || null;
  }

  async findDocumentsByClinic(
    clinicId: string,
    options?: { type?: DocumentType; limit?: number; offset?: number }
  ): Promise<Document[]> {
    const db = await readDatabase();
    let docs = db.documents
      .filter((d) => d.clinicId === clinicId && (!options?.type || d.type === options.type))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options?.offset) {
      docs = docs.slice(options.offset);
    }
    if (options?.limit) {
      docs = docs.slice(0, options.limit);
    }

    return docs;
  }

  async createDocument(data: CreateDocument): Promise<Document> {
    const db = await readDatabase();
    const document: Document = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
    };
    db.documents.push(document);
    await writeDatabase(db);
    return document;
  }

  async updateDocumentTracking(
    id: string,
    clinicId: string,
    tracking: { wasEnhanced?: boolean; wasPrinted?: boolean; wasCopied?: boolean }
  ): Promise<Document | null> {
    const db = await readDatabase();
    const index = db.documents.findIndex((d) => d.id === id && d.clinicId === clinicId);
    if (index === -1) return null;

    db.documents[index] = {
      ...db.documents[index],
      ...tracking,
    };
    await writeDatabase(db);
    return db.documents[index];
  }

  // ---------------------------------------------------------------------------
  // WEBHOOKS
  // ---------------------------------------------------------------------------

  async findWebhook(id: string, clinicId: string): Promise<Webhook | null> {
    const db = await readDatabase();
    return db.webhooks.find((w) => w.id === id && w.clinicId === clinicId) || null;
  }

  async findWebhooksByClinic(clinicId: string): Promise<Webhook[]> {
    const db = await readDatabase();
    return db.webhooks.filter((w) => w.clinicId === clinicId && w.isActive);
  }

  async findWebhooksByEvent(clinicId: string, event: string): Promise<Webhook[]> {
    const db = await readDatabase();
    return db.webhooks.filter((w) => {
      if (w.clinicId !== clinicId || !w.isActive) return false;
      const events = JSON.parse(w.events) as string[];
      return events.includes(event);
    });
  }

  async createWebhook(data: CreateWebhook): Promise<Webhook> {
    const db = await readDatabase();
    const webhook: Webhook = {
      ...data,
      id: generateId(),
      lastTriggeredAt: null,
      successCount: 0,
      failureCount: 0,
      lastError: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
    db.webhooks.push(webhook);
    await writeDatabase(db);
    return webhook;
  }

  async updateWebhook(id: string, clinicId: string, data: UpdateWebhook): Promise<Webhook | null> {
    const db = await readDatabase();
    const index = db.webhooks.findIndex((w) => w.id === id && w.clinicId === clinicId);
    if (index === -1) return null;

    db.webhooks[index] = {
      ...db.webhooks[index],
      ...data,
      updatedAt: new Date(),
    };
    await writeDatabase(db);
    return db.webhooks[index];
  }

  async recordWebhookResult(
    id: string,
    clinicId: string,
    success: boolean,
    error?: string
  ): Promise<void> {
    const db = await readDatabase();
    const index = db.webhooks.findIndex((w) => w.id === id && w.clinicId === clinicId);
    if (index === -1) return;

    db.webhooks[index].lastTriggeredAt = new Date();
    if (success) {
      db.webhooks[index].successCount++;
      db.webhooks[index].lastError = null;
    } else {
      db.webhooks[index].failureCount++;
      db.webhooks[index].lastError = error || 'Unknown error';
    }
    db.webhooks[index].updatedAt = new Date();
    await writeDatabase(db);
  }

  // ---------------------------------------------------------------------------
  // AUDIT LOGS
  // ---------------------------------------------------------------------------

  async createAuditLog(data: CreateAuditLog): Promise<AuditLog> {
    const db = await readDatabase();
    const log: AuditLog = {
      ...data,
      id: generateId(),
      createdAt: new Date(),
    };
    db.auditLogs.push(log);
    await writeDatabase(db);
    return log;
  }

  async findAuditLogs(
    clinicId: string,
    options?: {
      userId?: string;
      action?: string;
      resource?: string;
      limit?: number;
      offset?: number;
    }
  ): Promise<AuditLog[]> {
    const db = await readDatabase();
    let logs = db.auditLogs
      .filter(
        (l) =>
          l.clinicId === clinicId &&
          (!options?.userId || l.userId === options.userId) &&
          (!options?.action || l.action === options.action) &&
          (!options?.resource || l.resource === options.resource)
      )
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());

    if (options?.offset) {
      logs = logs.slice(options.offset);
    }
    if (options?.limit) {
      logs = logs.slice(0, options.limit);
    }

    return logs;
  }

  // ---------------------------------------------------------------------------
  // UTILIDADES
  // ---------------------------------------------------------------------------

  async getStats(clinicId: string): Promise<{
    totalDocuments: number;
    documentsThisMonth: number;
    totalUsers: number;
    totalServices: number;
    totalTemplates: number;
  }> {
    const db = await readDatabase();
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      totalDocuments: db.documents.filter((d) => d.clinicId === clinicId).length,
      documentsThisMonth: db.documents.filter(
        (d) => d.clinicId === clinicId && new Date(d.createdAt) >= startOfMonth
      ).length,
      totalUsers: db.users.filter((u) => u.clinicId === clinicId && u.isActive).length,
      totalServices: db.services.filter((s) => s.clinicId === clinicId && s.isActive).length,
      totalTemplates: db.templates.filter((t) => t.clinicId === clinicId && t.isActive).length,
    };
  }
}

// =============================================================================
// EXPORTAR CLIENTE
// =============================================================================

// Cliente singleton
let dbClient: JsonDatabaseClient | null = null;

export function getDbClient(): JsonDatabaseClient {
  if (!dbClient) {
    dbClient = new JsonDatabaseClient();
  }
  return dbClient;
}

// Exportar también el tipo para uso en tests
export type DbClient = JsonDatabaseClient;

// Alias para compatibilidad con Prisma
export const db = {
  get client() {
    return getDbClient();
  },
};
