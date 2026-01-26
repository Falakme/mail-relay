import Database from 'better-sqlite3';
import path from 'path';
import { EmailLog, ApiKey } from './types';

// Initialize SQLite database
const dbPath = path.join(process.cwd(), 'data', 'mail-relay.db');

// Ensure data directory exists
import fs from 'fs';
const dataDir = path.join(process.cwd(), 'data');
if (!fs.existsSync(dataDir)) {
  fs.mkdirSync(dataDir, { recursive: true });
}

const db = new Database(dbPath);

// Initialize tables
db.exec(`
  CREATE TABLE IF NOT EXISTS email_logs (
    id TEXT PRIMARY KEY,
    timestamp TEXT NOT NULL,
    recipient TEXT NOT NULL,
    subject TEXT NOT NULL,
    sender TEXT NOT NULL,
    status TEXT NOT NULL,
    provider TEXT NOT NULL,
    api_key_id TEXT,
    error_message TEXT
  );

  CREATE TABLE IF NOT EXISTS api_keys (
    id TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    key TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    last_used TEXT,
    is_active INTEGER DEFAULT 1
  );

  CREATE INDEX IF NOT EXISTS idx_email_logs_timestamp ON email_logs(timestamp DESC);
  CREATE INDEX IF NOT EXISTS idx_api_keys_key ON api_keys(key);
`);

// Migration: Add api_key_id column if it doesn't exist
try {
  db.exec(`ALTER TABLE email_logs ADD COLUMN api_key_id TEXT`);
} catch {
  // Column already exists, ignore error
}

// Email Logs Functions
export function logEmail(log: EmailLog): void {
  const stmt = db.prepare(`
    INSERT INTO email_logs (id, timestamp, recipient, subject, sender, status, provider, api_key_id, error_message)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    log.id,
    log.timestamp,
    log.recipient,
    log.subject,
    log.sender,
    log.status,
    log.provider,
    log.apiKeyId || null,
    log.errorMessage || null
  );
}

export function getEmailLogs(limit: number = 100, offset: number = 0): EmailLog[] {
  const stmt = db.prepare(`
    SELECT 
      e.id, e.timestamp, e.recipient, e.subject, e.sender, e.status, e.provider, 
      e.api_key_id as apiKeyId, e.error_message as errorMessage,
      a.name as apiKeyName
    FROM email_logs e
    LEFT JOIN api_keys a ON e.api_key_id = a.id
    ORDER BY e.timestamp DESC
    LIMIT ? OFFSET ?
  `);
  return stmt.all(limit, offset) as EmailLog[];
}

export function getEmailLogCount(): number {
  const stmt = db.prepare('SELECT COUNT(*) as count FROM email_logs');
  const result = stmt.get() as { count: number };
  return result.count;
}

export function deleteEmailLog(id: string): boolean {
  const stmt = db.prepare('DELETE FROM email_logs WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

// API Keys Functions
export function createApiKey(apiKey: ApiKey): void {
  const stmt = db.prepare(`
    INSERT INTO api_keys (id, name, key, created_at, last_used, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  stmt.run(
    apiKey.id,
    apiKey.name,
    apiKey.key,
    apiKey.createdAt,
    apiKey.lastUsed || null,
    apiKey.isActive ? 1 : 0
  );
}

export function getApiKeys(): ApiKey[] {
  const stmt = db.prepare(`
    SELECT id, name, key, created_at as createdAt, last_used as lastUsed, is_active as isActive
    FROM api_keys
    ORDER BY created_at DESC
  `);
  const results = stmt.all() as (Omit<ApiKey, 'isActive'> & { isActive: number })[];
  return results.map(row => ({
    ...row,
    isActive: row.isActive === 1
  }));
}

export function getApiKeyByKey(key: string): ApiKey | null {
  const stmt = db.prepare(`
    SELECT id, name, key, created_at as createdAt, last_used as lastUsed, is_active as isActive
    FROM api_keys
    WHERE key = ? AND is_active = 1
    LIMIT 1
  `);
  const result = stmt.get(key) as (Omit<ApiKey, 'isActive'> & { isActive: number }) | undefined;
  if (!result) return null;
  return {
    ...result,
    isActive: result.isActive === 1
  };
}

export function updateApiKeyLastUsed(id: string): void {
  const stmt = db.prepare('UPDATE api_keys SET last_used = ? WHERE id = ?');
  stmt.run(new Date().toISOString(), id);
}

export function toggleApiKeyStatus(id: string): boolean {
  const stmt = db.prepare('UPDATE api_keys SET is_active = NOT is_active WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function deleteApiKey(id: string): boolean {
  const stmt = db.prepare('DELETE FROM api_keys WHERE id = ?');
  const result = stmt.run(id);
  return result.changes > 0;
}

export function updateApiKey(id: string, updates: Partial<Pick<ApiKey, 'name'>>): boolean {
  const fields: string[] = [];
  const values: (string | number)[] = [];

  if (updates.name !== undefined) {
    fields.push('name = ?');
    values.push(updates.name);
  }

  if (fields.length === 0) return false;

  values.push(id);
  const stmt = db.prepare(`UPDATE api_keys SET ${fields.join(', ')} WHERE id = ?`);
  const result = stmt.run(...values);
  return result.changes > 0;
}

export default db;
