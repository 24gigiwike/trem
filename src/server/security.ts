import crypto from 'node:crypto';
import path from 'node:path';

const RUNTIME_SESSION_SECRET = process.env.TREM_SESSION_SECRET || crypto.randomBytes(32).toString('hex');
const RUNTIME_WEBHOOK_SECRET = process.env.TREM_WEBHOOK_SECRET || crypto.randomBytes(32).toString('hex');

export function hashPassword(password: string): string {
  const salt = crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, salt, 64).toString('hex');
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const parts = storedHash.split(':');
  if (parts.length !== 2) return false;
  const [salt, keyHex] = parts;
  if (!salt || !keyHex) return false;
  const derived = crypto.scryptSync(password, salt, 64);
  const storedBuf = Buffer.from(keyHex, 'hex');
  if (derived.length !== storedBuf.length) return false;
  return crypto.timingSafeEqual(derived, storedBuf);
}

export function generateToken(): string {
  return crypto.randomBytes(32).toString('hex');
}

export function hashToken(token: string): string {
  return crypto.createHmac('sha256', RUNTIME_SESSION_SECRET).update(token).digest('hex');
}

export function signWebhookPayload(rawPayload: string): string {
  return crypto.createHmac('sha256', RUNTIME_WEBHOOK_SECRET).update(rawPayload).digest('hex');
}

export function verifyWebhookSignature(rawPayload: string, signatureHeader: string | undefined): boolean {
  if (!signatureHeader) return false;
  const expected = signWebhookPayload(rawPayload);
  const sigBuf = Buffer.from(signatureHeader, 'utf8');
  const expBuf = Buffer.from(expected, 'utf8');
  if (sigBuf.length !== expBuf.length) return false;
  return crypto.timingSafeEqual(sigBuf, expBuf);
}

export function sanitizeSlug(input: string): string {
  return input
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 64);
}

export function safeUploadPath(baseDir: string, fileName: string): string | null {
  const cleanName = path.basename(fileName).replace(/[^a-zA-Z0-9._-]/g, '_');
  const resolvedBase = path.resolve(baseDir);
  const resolvedTarget = path.resolve(resolvedBase, cleanName);
  if (!resolvedTarget.startsWith(resolvedBase + path.sep)) {
    return null;
  }
  return resolvedTarget;
}

export function getAdminPasscodeFromEnv(): string {
  return (process.env.TREM_ADMIN_PASSCODE || '').trim();
}
