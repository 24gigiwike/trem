import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import express from 'express';
import type { Request, Response, NextFunction } from 'express';
import { z } from 'zod';
import { db } from './db.ts';
import {
  generateToken,
  getAdminPasscodeFromEnv,
  hashPassword,
  hashToken,
  safeUploadPath,
  sanitizeSlug,
  signWebhookPayload,
  verifyPassword,
  verifyWebhookSignature,
} from './security.ts';
import {
  calculatePromotionQuote,
  calculateSubscriptionQuote,
  PROMOTION_PACKAGES,
  SUBSCRIPTION_PLANS,
} from '../shared/commercial.ts';

const UPLOADS_DIR = path.resolve(process.cwd(), 'uploads');
if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

interface AuthedUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'seeker' | 'vendor' | 'agency' | 'admin';
  status: string;
  emailVerified: boolean;
}

interface AuthedRequest extends Request {
  user?: AuthedUser;
  rawBody?: string;
}

function getBearerToken(req: Request): string | null {
  const auth = req.headers.authorization;
  if (!auth || !auth.startsWith('Bearer ')) return null;
  return auth.slice(7).trim() || null;
}

function resolveUser(req: AuthedRequest): AuthedUser | null {
  const token = getBearerToken(req);
  if (!token) return null;
  const tokenHash = hashToken(token);
  const row = db
    .prepare(
      `SELECT u.id, u.email, u.first_name, u.last_name, u.phone, u.role, u.status, u.email_verified, s.expires_at
       FROM sessions s
       JOIN users u ON u.id = s.user_id
       WHERE s.token_hash = ?`
    )
    .get(tokenHash) as Record<string, unknown> | undefined;

  if (!row) return null;
  if (new Date(String(row.expires_at)).getTime() < Date.now()) {
    db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(tokenHash);
    return null;
  }
  if (row.status === 'suspended') return null;

  return {
    id: String(row.id),
    email: String(row.email),
    firstName: String(row.first_name),
    lastName: String(row.last_name),
    phone: String(row.phone),
    role: row.role as AuthedUser['role'],
    status: String(row.status),
    emailVerified: Boolean(row.email_verified),
  };
}

function requireAuth(req: AuthedRequest, res: Response, next: NextFunction): void {
  const user = resolveUser(req);
  if (!user) {
    res.status(401).json({ error: 'Authentication required. Please sign in.' });
    return;
  }
  req.user = user;
  next();
}

function requireRoles(...roles: AuthedUser['role'][]) {
  return (req: AuthedRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({ error: 'Authentication required.' });
      return;
    }
    if (!roles.includes(req.user.role)) {
      res.status(403).json({ error: 'You do not have permission to perform this action.' });
      return;
    }
    next();
  };
}

function writeAuditLog(
  actorUserId: string,
  actorRole: string,
  action: string,
  targetType: string,
  targetId: string,
  details: string
): void {
  db.prepare(
    `INSERT INTO audit_logs (id, actor_user_id, actor_role, action, target_type, target_id, details, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`
  ).run(`aud_${crypto.randomUUID().slice(0, 10)}`, actorUserId, actorRole, action, targetType, targetId, details, new Date().toISOString());
}

function createNotification(userId: string, title: string, body: string, link = '/'): void {
  db.prepare(
    `INSERT INTO notifications (id, user_id, title, body, link, is_read, created_at)
     VALUES (?, ?, ?, ?, ?, 0, ?)`
  ).run(`ntf_${crypto.randomUUID().slice(0, 10)}`, userId, title, body, link, new Date().toISOString());
}

function mapPropertyRow(row: Record<string, unknown>) {
  return {
    id: String(row.id),
    refCode: String(row.ref_code),
    vendorId: String(row.vendor_id),
    vendorName: row.vendor_name ? String(row.vendor_name) : undefined,
    vendorSlug: row.vendor_slug ? String(row.vendor_slug) : undefined,
    vendorVerified: row.vendor_verification_status === 'verified',
    vendorRating: row.vendor_rating !== undefined ? Number(row.vendor_rating) : undefined,
    vendorPhone: row.vendor_phone ? String(row.vendor_phone) : undefined,
    title: String(row.title),
    slug: String(row.slug),
    purpose: String(row.purpose),
    category: String(row.category),
    subcategory: String(row.subcategory || ''),
    description: String(row.description || ''),
    priceNgn: Number(row.price_ngn),
    priceUnit: String(row.price_unit || ''),
    address: String(row.address || ''),
    corridor: String(row.corridor || ''),
    lga: String(row.lga || ''),
    city: String(row.city || ''),
    state: String(row.state || ''),
    latitude: Number(row.latitude),
    longitude: Number(row.longitude),
    beaconRef: String(row.beacon_ref || ''),
    bedrooms: Number(row.bedrooms),
    bathrooms: Number(row.bathrooms),
    areaSqm: Number(row.area_sqm),
    garageBays: Number(row.garage_bays),
    yearBuilt: Number(row.year_built),
    smartIot: Boolean(row.smart_iot),
    titleDocType: String(row.title_doc_type || ''),
    surveyPlanNo: String(row.survey_plan_no || ''),
    bureauFileNo: String(row.bureau_file_no || ''),
    scumlCleared: Boolean(row.scuml_cleared),
    walkScore: Number(row.walk_score),
    amenities: JSON.parse(String(row.amenities_json || '[]')) as string[],
    images: JSON.parse(String(row.images_json || '[]')) as string[],
    videoUrl: String(row.video_url || ''),
    healthScore: Number(row.health_score),
    status: String(row.status),
    moderationNote: String(row.moderation_note || ''),
    isFeatured: Boolean(row.is_featured),
    isPromoted: Boolean(row.is_promoted),
    promotionTier: row.promotion_tier ? String(row.promotion_tier) : null,
    viewsCount: Number(row.views_count),
    inquiriesCount: row.inquiries_count !== undefined ? Number(row.inquiries_count) : undefined,
    createdAt: String(row.created_at),
    updatedAt: String(row.updated_at),
  };
}

function getVendorByUserId(userId: string) {
  return db.prepare('SELECT * FROM vendor_profiles WHERE user_id = ?').get(userId) as Record<string, unknown> | undefined;
}

function getActiveSubscription(vendorId: string) {
  const row = db
    .prepare(
      `SELECT * FROM subscriptions
       WHERE vendor_id = ? AND status = 'active' AND expires_at > ?
       ORDER BY expires_at DESC LIMIT 1`
    )
    .get(vendorId, new Date().toISOString()) as Record<string, unknown> | undefined;
  if (!row) return null;
  return {
    id: String(row.id),
    vendorId: String(row.vendor_id),
    planCode: String(row.plan_code) as 'standard' | 'premium',
    billingMonths: Number(row.billing_months) as 1 | 3 | 6 | 12,
    status: String(row.status),
    startsAt: String(row.starts_at),
    expiresAt: String(row.expires_at),
    autoRenew: Boolean(row.auto_renew),
    createdAt: String(row.created_at),
  };
}

export function createApiRouter() {
  const router = express.Router();

  router.get('/health', (_req, res) => {
    res.json({ ok: true, service: 'trem-marketplace-api', timestamp: new Date().toISOString() });
  });

  // ==========================================
  // AUTHENTICATION & ROLE ONBOARDING
  // ==========================================

  const registerSchema = z.object({
    firstName: z.string().trim().min(2).max(60),
    lastName: z.string().trim().min(2).max(60),
    email: z.string().trim().email().max(120),
    phone: z.string().trim().min(7).max(24),
    password: z.string().min(8).max(128),
    role: z.enum(['seeker', 'vendor', 'agency']), // Public registration NEVER permits 'admin'
    businessName: z.string().trim().max(120).optional(),
    representativeRole: z.string().trim().max(80).optional(),
    address: z.string().trim().max(200).optional(),
    city: z.string().trim().max(80).optional(),
    state: z.string().trim().max(80).optional(),
  });

  router.post('/auth/register', (req, res) => {
    const parsed = registerSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid registration data.' });
      return;
    }

    const data = parsed.data;
    const normalizedEmail = data.email.toLowerCase();
    const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(normalizedEmail);
    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const userId = `usr_${crypto.randomUUID().slice(0, 12)}`;
    const now = new Date().toISOString();
    const otp = String(crypto.randomInt(100000, 999999));
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, email_verified, otp_code_hash, otp_expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?, 'active', 0, ?, ?, ?)`
    ).run(userId, normalizedEmail, hashPassword(data.password), data.firstName, data.lastName, data.phone, data.role, hashToken(otp), otpExpires, now);

    if (data.role === 'vendor' || data.role === 'agency') {
      const bizName = data.businessName?.trim() || `${data.firstName} ${data.lastName}${data.role === 'agency' ? ' Properties Ltd' : ' Holdings'}`;
      const baseSlug = sanitizeSlug(bizName) || userId;
      const slug = `${baseSlug}-${crypto.randomBytes(2).toString('hex')}`;
      const vendorId = `vnd_${crypto.randomUUID().slice(0, 10)}`;
      db.prepare(
        `INSERT INTO vendor_profiles (
          id, user_id, entity_type, business_name, slug, representative_name, representative_role,
          address, city, state, bio, verification_status, member_since, created_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'unverified', ?, ?)`
      ).run(
        vendorId,
        userId,
        data.role,
        bizName,
        slug,
        `${data.firstName} ${data.lastName}`,
        data.representativeRole || (data.role === 'agency' ? 'Principal Broker / Managing Director' : 'Independent Vendor'),
        data.address || '',
        data.city || 'Lagos',
        data.state || 'Lagos',
        `${bizName} — Registered TREM ${data.role === 'agency' ? 'real estate brokerage' : 'independent vendor'}.`,
        String(new Date().getFullYear()),
        now
      );
    }

    const rawToken = generateToken();
    const sessionExpires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
      hashToken(rawToken),
      userId,
      sessionExpires,
      now
    );

    createNotification(
      userId,
      'Welcome to TREM',
      data.role === 'seeker'
        ? 'Your Property Seeker account is ready. Save listings and schedule inspections.'
        : 'Complete OTP verification, choose a subscription plan, and upload KYC credentials to publish listings.',
      data.role === 'seeker' ? '/seeker' : '/vendor/onboarding'
    );

    res.status(201).json({
      token: rawToken,
      sandboxOtpPreview: otp,
      user: {
        id: userId,
        email: normalizedEmail,
        firstName: data.firstName,
        lastName: data.lastName,
        phone: data.phone,
        role: data.role,
        status: 'active',
        emailVerified: false,
        createdAt: now,
      },
    });
  });

  router.post('/auth/verify-otp', requireAuth, (req: AuthedRequest, res) => {
    const otpSchema = z.object({ otp: z.string().trim().length(6) });
    const parsed = otpSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Enter the 6-digit verification code.' });
      return;
    }
    const row = db.prepare('SELECT otp_code_hash, otp_expires_at FROM users WHERE id = ?').get(req.user!.id) as
      | { otp_code_hash: string; otp_expires_at: string }
      | undefined;

    if (!row || !row.otp_code_hash) {
      res.status(400).json({ error: 'No pending OTP verification found.' });
      return;
    }
    if (new Date(row.otp_expires_at).getTime() < Date.now()) {
      res.status(400).json({ error: 'OTP expired. Request a new code.' });
      return;
    }
    if (hashToken(parsed.data.otp) !== row.otp_code_hash) {
      res.status(400).json({ error: 'Invalid OTP verification code.' });
      return;
    }

    db.prepare('UPDATE users SET email_verified = 1, otp_code_hash = ?, otp_expires_at = ? WHERE id = ?').run('', '', req.user!.id);
    res.json({ verified: true });
  });

  router.post('/auth/resend-otp', requireAuth, (req: AuthedRequest, res) => {
    const otp = String(crypto.randomInt(100000, 999999));
    const otpExpires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    db.prepare('UPDATE users SET otp_code_hash = ?, otp_expires_at = ? WHERE id = ?').run(hashToken(otp), otpExpires, req.user!.id);
    res.json({ sent: true, sandboxOtpPreview: otp });
  });

  router.post('/auth/login', (req, res) => {
    const schema = z.object({
      email: z.string().trim().email(),
      password: z.string().min(1),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email and password are required.' });
      return;
    }

    const row = db.prepare('SELECT * FROM users WHERE email = ?').get(parsed.data.email.toLowerCase()) as
      | Record<string, unknown>
      | undefined;
    if (!row || !verifyPassword(parsed.data.password, String(row.password_hash))) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }
    if (row.status === 'suspended') {
      res.status(403).json({ error: 'Account suspended. Contact TREM compliance support.' });
      return;
    }

    const rawToken = generateToken();
    const now = new Date().toISOString();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
      hashToken(rawToken),
      String(row.id),
      expires,
      now
    );

    res.json({
      token: rawToken,
      user: {
        id: String(row.id),
        email: String(row.email),
        firstName: String(row.first_name),
        lastName: String(row.last_name),
        phone: String(row.phone),
        role: String(row.role),
        status: String(row.status),
        emailVerified: Boolean(row.email_verified),
        createdAt: String(row.created_at),
      },
    });
  });

  router.post('/auth/logout', requireAuth, (req: AuthedRequest, res) => {
    const token = getBearerToken(req);
    if (token) {
      db.prepare('DELETE FROM sessions WHERE token_hash = ?').run(hashToken(token));
    }
    res.json({ ok: true });
  });

  router.post('/auth/forgot-password', (req, res) => {
    const schema = z.object({ email: z.string().trim().email() });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid email is required.' });
      return;
    }
    const row = db.prepare('SELECT id FROM users WHERE email = ?').get(parsed.data.email.toLowerCase()) as { id: string } | undefined;
    if (!row) {
      res.json({ sent: true });
      return;
    }
    const otp = String(crypto.randomInt(100000, 999999));
    const expires = new Date(Date.now() + 15 * 60 * 1000).toISOString();
    db.prepare('UPDATE users SET otp_code_hash = ?, otp_expires_at = ? WHERE id = ?').run(hashToken(otp), expires, row.id);
    res.json({ sent: true, sandboxOtpPreview: otp });
  });

  router.post('/auth/reset-password', (req, res) => {
    const schema = z.object({
      email: z.string().trim().email(),
      otp: z.string().trim().length(6),
      newPassword: z.string().min(8).max(128),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Email, 6-digit code, and new password (min 8 chars) are required.' });
      return;
    }
    const row = db
      .prepare('SELECT id, otp_code_hash, otp_expires_at FROM users WHERE email = ?')
      .get(parsed.data.email.toLowerCase()) as { id: string; otp_code_hash: string; otp_expires_at: string } | undefined;

    if (!row || !row.otp_code_hash || hashToken(parsed.data.otp) !== row.otp_code_hash || new Date(row.otp_expires_at).getTime() < Date.now()) {
      res.status(400).json({ error: 'Invalid or expired reset code.' });
      return;
    }

    db.prepare('UPDATE users SET password_hash = ?, otp_code_hash = ?, otp_expires_at = ? WHERE id = ?').run(
      hashPassword(parsed.data.newPassword),
      '',
      '',
      row.id
    );
    res.json({ reset: true });
  });

  // Admin status & first-run claim / passcode authentication
  router.get('/auth/admin-status', (_req, res) => {
    const envPass = getAdminPasscodeFromEnv();
    const bootstrapRow = db.prepare('SELECT id FROM admin_bootstrap LIMIT 1').get() as { id: string } | undefined;
    res.json({
      envConfigured: Boolean(envPass),
      claimed: Boolean(bootstrapRow),
    });
  });

  router.post('/auth/admin-access', (req, res) => {
    const schema = z.object({
      email: z.string().trim().email().default('admin@trem.ng'),
      passcode: z.string().min(8).max(128),
      firstName: z.string().trim().min(2).max(50).optional(),
      lastName: z.string().trim().min(2).max(50).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid admin email and passcode (min 8 characters) required.' });
      return;
    }

    const envPass = getAdminPasscodeFromEnv();
    const bootstrapRow = db.prepare('SELECT * FROM admin_bootstrap LIMIT 1').get() as
      | { id: string; passcode_hash: string; claimed_by_user_id: string }
      | undefined;

    const now = new Date().toISOString();
    let adminUserId = '';

    if (envPass) {
      // Configured environment secret overrides any claimed fallback
      const envBuf = Buffer.from(envPass, 'utf8');
      const reqBuf = Buffer.from(parsed.data.passcode, 'utf8');
      if (envBuf.length !== reqBuf.length || !crypto.timingSafeEqual(envBuf, reqBuf)) {
        res.status(401).json({ error: 'Invalid administrator passcode.' });
        return;
      }
      const existingAdmin = db.prepare("SELECT id FROM users WHERE role = 'admin' LIMIT 1").get() as { id: string } | undefined;
      if (existingAdmin) {
        adminUserId = existingAdmin.id;
      } else {
        adminUserId = `usr_admin_${crypto.randomUUID().slice(0, 8)}`;
        db.prepare(
          `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, email_verified, created_at)
           VALUES (?, ?, ?, ?, ?, '+2348008736732', 'admin', 'active', 1, ?)`
        ).run(
          adminUserId,
          parsed.data.email.toLowerCase(),
          hashPassword(crypto.randomBytes(24).toString('hex')),
          parsed.data.firstName || 'TREM',
          parsed.data.lastName || 'Administrator',
          now
        );
      }
    } else if (!bootstrapRow) {
      // First-run atomic bootstrap claim
      adminUserId = `usr_admin_${crypto.randomUUID().slice(0, 8)}`;
      const passHash = hashPassword(parsed.data.passcode);
      db.prepare(
        `INSERT INTO users (id, email, password_hash, first_name, last_name, phone, role, status, email_verified, created_at)
         VALUES (?, ?, ?, ?, ?, '+2348008736732', 'admin', 'active', 1, ?)`
      ).run(
        adminUserId,
        parsed.data.email.toLowerCase(),
        passHash,
        parsed.data.firstName || 'TREM',
        parsed.data.lastName || 'Administrator',
        now
      );
      db.prepare('INSERT INTO admin_bootstrap (id, passcode_hash, claimed_by_user_id, created_at) VALUES (?, ?, ?, ?)').run(
        'primary',
        passHash,
        adminUserId,
        now
      );
      writeAuditLog(adminUserId, 'admin', 'ADMIN_BOOTSTRAP_CLAIMED', 'admin_bootstrap', 'primary', 'Initial administrator console claimed');
    } else {
      // Verify against claimed bootstrap hash
      if (!verifyPassword(parsed.data.passcode, bootstrapRow.passcode_hash)) {
        res.status(401).json({ error: 'Invalid administrator passcode.' });
        return;
      }
      adminUserId = bootstrapRow.claimed_by_user_id;
    }

    const adminRow = db.prepare('SELECT * FROM users WHERE id = ?').get(adminUserId) as Record<string, unknown>;
    const rawToken = generateToken();
    const expires = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
    db.prepare('INSERT INTO sessions (token_hash, user_id, expires_at, created_at) VALUES (?, ?, ?, ?)').run(
      hashToken(rawToken),
      adminUserId,
      expires,
      now
    );

    res.json({
      token: rawToken,
      user: {
        id: String(adminRow.id),
        email: String(adminRow.email),
        firstName: String(adminRow.first_name),
        lastName: String(adminRow.last_name),
        phone: String(adminRow.phone),
        role: 'admin',
        status: String(adminRow.status),
        emailVerified: true,
        createdAt: String(adminRow.created_at),
      },
    });
  });

  router.get('/auth/me', requireAuth, (req: AuthedRequest, res) => {
    const user = req.user!;
    const vendorRow = getVendorByUserId(user.id);
    const subscription = vendorRow ? getActiveSubscription(String(vendorRow.id)) : null;
    const unreadRow = db
      .prepare('SELECT COUNT(*) as count FROM notifications WHERE user_id = ? AND is_read = 0')
      .get(user.id) as { count: number };

    res.json({
      user,
      vendorProfile: vendorRow
        ? {
            id: String(vendorRow.id),
            userId: String(vendorRow.user_id),
            entityType: String(vendorRow.entity_type),
            businessName: String(vendorRow.business_name),
            slug: String(vendorRow.slug),
            representativeName: String(vendorRow.representative_name),
            representativeRole: String(vendorRow.representative_role),
            rcNumber: String(vendorRow.rc_number || ''),
            tinNumber: String(vendorRow.tin_number || ''),
            scumlNumber: String(vendorRow.scuml_number || ''),
            redanNumber: String(vendorRow.redan_number || ''),
            lasreraLicense: String(vendorRow.lasrera_license || ''),
            address: String(vendorRow.address || ''),
            abujaAddress: String(vendorRow.abuja_address || ''),
            city: String(vendorRow.city || ''),
            state: String(vendorRow.state || ''),
            bio: String(vendorRow.bio || ''),
            logoUrl: String(vendorRow.logo_url || ''),
            verificationStatus: String(vendorRow.verification_status),
            verificationNotes: String(vendorRow.verification_notes || ''),
            avgResponseTime: String(vendorRow.avg_response_time || '< 1 hr'),
            memberSince: String(vendorRow.member_since || '2025'),
            rating: Number(vendorRow.rating || 4.8),
            reviewCount: Number(vendorRow.review_count || 0),
          }
        : null,
      subscription,
      unreadNotifications: unreadRow.count,
    });
  });

  router.patch('/auth/profile', requireAuth, (req: AuthedRequest, res) => {
    const schema = z.object({
      firstName: z.string().trim().min(2).max(60),
      lastName: z.string().trim().min(2).max(60),
      phone: z.string().trim().min(7).max(24),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid name and phone number required.' });
      return;
    }
    db.prepare('UPDATE users SET first_name = ?, last_name = ?, phone = ? WHERE id = ?').run(
      parsed.data.firstName,
      parsed.data.lastName,
      parsed.data.phone,
      req.user!.id
    );
    res.json({ updated: true });
  });

  // ==========================================
  // PUBLIC MARKETPLACE & DISCOVERY
  // ==========================================

  router.get('/public/properties', (req, res) => {
    const q = String(req.query.q || '').trim().toLowerCase();
    const category = String(req.query.category || 'all').trim();
    const purpose = String(req.query.purpose || 'all').trim();
    const state = String(req.query.state || '').trim();
    const titleDoc = String(req.query.titleDoc || '').trim();
    const beds = Number(req.query.beds || 0);
    const minPrice = Number(req.query.minPrice || 0);
    const maxPrice = Number(req.query.maxPrice || 0);
    const verifiedOnly = req.query.verifiedOnly === 'true';
    const sort = String(req.query.sort || 'featured');
    const page = Math.max(1, Number(req.query.page || 1));
    const limit = Math.min(24, Math.max(1, Number(req.query.limit || 9)));

    const where: string[] = ["p.status = 'published'"];
    const params: (string | number)[] = [];

    if (q) {
      where.push(
        '(LOWER(p.title) LIKE ? OR LOWER(p.address) LIKE ? OR LOWER(p.corridor) LIKE ? OR LOWER(p.city) LIKE ? OR LOWER(p.state) LIKE ? OR LOWER(p.ref_code) LIKE ?)'
      );
      const pattern = `%${q}%`;
      params.push(pattern, pattern, pattern, pattern, pattern, pattern);
    }
    if (category && category !== 'all') {
      where.push('p.category = ?');
      params.push(category);
    }
    if (purpose && purpose !== 'all') {
      where.push('p.purpose = ?');
      params.push(purpose);
    }
    if (state && state !== 'all') {
      where.push('LOWER(p.state) LIKE ?');
      params.push(`%${state.toLowerCase()}%`);
    }
    if (titleDoc && titleDoc !== 'all') {
      where.push('LOWER(p.title_doc_type) LIKE ?');
      params.push(`%${titleDoc.toLowerCase()}%`);
    }
    if (beds > 0) {
      where.push('p.bedrooms >= ?');
      params.push(beds);
    }
    if (minPrice > 0) {
      where.push('p.price_ngn >= ?');
      params.push(minPrice);
    }
    if (maxPrice > 0) {
      where.push('p.price_ngn <= ?');
      params.push(maxPrice);
    }
    if (verifiedOnly) {
      where.push("v.verification_status = 'verified'");
    }

    const whereSql = where.join(' AND ');
    let orderSql = 'p.is_promoted DESC, p.is_featured DESC, p.created_at DESC';
    if (sort === 'price_asc') orderSql = 'p.price_ngn ASC';
    if (sort === 'price_desc') orderSql = 'p.price_ngn DESC';
    if (sort === 'newest') orderSql = 'p.created_at DESC';

    const countRow = db
      .prepare(
        `SELECT COUNT(*) as total
         FROM properties p
         JOIN vendor_profiles v ON v.id = p.vendor_id
         WHERE ${whereSql}`
      )
      .get(...params) as { total: number };

    const offset = (page - 1) * limit;
    const rows = db
      .prepare(
        `SELECT p.*, v.business_name as vendor_name, v.slug as vendor_slug,
                v.verification_status as vendor_verification_status, v.rating as vendor_rating,
                u.phone as vendor_phone
         FROM properties p
         JOIN vendor_profiles v ON v.id = p.vendor_id
         JOIN users u ON u.id = v.user_id
         WHERE ${whereSql}
         ORDER BY ${orderSql}
         LIMIT ? OFFSET ?`
      )
      .all(...params, limit, offset) as Record<string, unknown>[];

    const categoryCounts = db
      .prepare(
        `SELECT category, COUNT(*) as count
         FROM properties WHERE status = 'published'
         GROUP BY category`
      )
      .all() as { category: string; count: number }[];

    res.json({
      items: rows.map(mapPropertyRow),
      total: countRow.total,
      page,
      totalPages: Math.max(1, Math.ceil(countRow.total / limit)),
      categoryCounts: Object.fromEntries(categoryCounts.map((c) => [c.category, c.count])),
    });
  });

  router.get('/public/properties/:idOrRef', (req, res) => {
    const key = req.params.idOrRef;
    const row = db
      .prepare(
        `SELECT p.*, v.business_name as vendor_name, v.slug as vendor_slug,
                v.verification_status as vendor_verification_status, v.rating as vendor_rating,
                v.rc_number as vendor_rc, v.member_since as vendor_member_since,
                v.avg_response_time as vendor_response_time, v.logo_url as vendor_logo,
                u.phone as vendor_phone
         FROM properties p
         JOIN vendor_profiles v ON v.id = p.vendor_id
         JOIN users u ON u.id = v.user_id
         WHERE p.id = ? OR p.ref_code = ? OR p.slug = ?`
      )
      .get(key, key, key) as Record<string, unknown> | undefined;

    if (!row) {
      res.status(404).json({ error: 'Property listing not found.' });
      return;
    }

    if (row.status === 'published') {
      db.prepare('UPDATE properties SET views_count = views_count + 1 WHERE id = ?').run(String(row.id));
    }

    const similarRows = db
      .prepare(
        `SELECT p.*, v.business_name as vendor_name, v.slug as vendor_slug,
                v.verification_status as vendor_verification_status, v.rating as vendor_rating,
                u.phone as vendor_phone
         FROM properties p
         JOIN vendor_profiles v ON v.id = p.vendor_id
         JOIN users u ON u.id = v.user_id
         WHERE p.status = 'published' AND p.id != ? AND (p.category = ? OR p.state = ?)
         ORDER BY p.is_promoted DESC, p.created_at DESC
         LIMIT 3`
      )
      .all(String(row.id), String(row.category), String(row.state)) as Record<string, unknown>[];

    const listingCount = db
      .prepare("SELECT COUNT(*) as count FROM properties WHERE vendor_id = ? AND status = 'published'")
      .get(String(row.vendor_id)) as { count: number };

    res.json({
      property: mapPropertyRow(row),
      vendor: {
        id: String(row.vendor_id),
        businessName: String(row.vendor_name),
        slug: String(row.vendor_slug),
        verified: row.vendor_verification_status === 'verified',
        rcNumber: String(row.vendor_rc || ''),
        memberSince: String(row.vendor_member_since || '2021'),
        avgResponseTime: String(row.vendor_response_time || '< 1 hr'),
        logoUrl: String(row.vendor_logo || ''),
        phone: String(row.vendor_phone || ''),
        activeListings: listingCount.count,
      },
      similar: similarRows.map(mapPropertyRow),
    });
  });

  router.get('/public/agencies', (_req, res) => {
    const rows = db
      .prepare(
        `SELECT v.*, u.phone,
                (SELECT COUNT(*) FROM properties p WHERE p.vendor_id = v.id AND p.status = 'published') as active_listings
         FROM vendor_profiles v
         JOIN users u ON u.id = v.user_id
         ORDER BY v.verification_status = 'verified' DESC, v.rating DESC`
      )
      .all() as Record<string, unknown>[];

    res.json({
      agencies: rows.map((r) => ({
        id: String(r.id),
        entityType: String(r.entity_type),
        businessName: String(r.business_name),
        slug: String(r.slug),
        city: String(r.city || ''),
        state: String(r.state || ''),
        rcNumber: String(r.rc_number || ''),
        verificationStatus: String(r.verification_status),
        logoUrl: String(r.logo_url || ''),
        rating: Number(r.rating),
        reviewCount: Number(r.review_count),
        activeListings: Number(r.active_listings || 0),
      })),
    });
  });

  router.get('/public/agencies/:slug', (req, res) => {
    const vendor = db
      .prepare(
        `SELECT v.*, u.phone, u.email
         FROM vendor_profiles v
         JOIN users u ON u.id = v.user_id
         WHERE v.slug = ? OR v.id = ?`
      )
      .get(req.params.slug, req.params.slug) as Record<string, unknown> | undefined;

    if (!vendor) {
      res.status(404).json({ error: 'Agency or vendor profile not found.' });
      return;
    }

    const properties = db
      .prepare(
        `SELECT p.*, v.business_name as vendor_name, v.slug as vendor_slug,
                v.verification_status as vendor_verification_status, v.rating as vendor_rating,
                u.phone as vendor_phone
         FROM properties p
         JOIN vendor_profiles v ON v.id = p.vendor_id
         JOIN users u ON u.id = v.user_id
         WHERE p.vendor_id = ? AND p.status = 'published'
         ORDER BY p.is_promoted DESC, p.created_at DESC`
      )
      .all(String(vendor.id)) as Record<string, unknown>[];

    const team = db
      .prepare('SELECT * FROM agency_team_members WHERE vendor_id = ?')
      .all(String(vendor.id)) as Record<string, unknown>[];

    res.json({
      agency: {
        id: String(vendor.id),
        entityType: String(vendor.entity_type),
        businessName: String(vendor.business_name),
        slug: String(vendor.slug),
        representativeName: String(vendor.representative_name),
        representativeRole: String(vendor.representative_role),
        rcNumber: String(vendor.rc_number || ''),
        scumlNumber: String(vendor.scuml_number || ''),
        redanNumber: String(vendor.redan_number || ''),
        lasreraLicense: String(vendor.lasrera_license || ''),
        address: String(vendor.address || ''),
        abujaAddress: String(vendor.abuja_address || ''),
        city: String(vendor.city || ''),
        state: String(vendor.state || ''),
        bio: String(vendor.bio || ''),
        logoUrl: String(vendor.logo_url || ''),
        verificationStatus: String(vendor.verification_status),
        avgResponseTime: String(vendor.avg_response_time || '< 1 hr'),
        memberSince: String(vendor.member_since || '2021'),
        rating: Number(vendor.rating || 4.8),
        reviewCount: Number(vendor.review_count || 0),
        phone: String(vendor.phone || ''),
        email: String(vendor.email || ''),
      },
      team: team.map((t) => ({
        id: String(t.id),
        vendorId: String(t.vendor_id),
        fullName: String(t.full_name),
        title: String(t.title),
        credentials: String(t.credentials || ''),
        bio: String(t.bio || ''),
        avatarUrl: String(t.avatar_url || ''),
        phone: String(t.phone || ''),
        email: String(t.email || ''),
      })),
      properties: properties.map(mapPropertyRow),
    });
  });

  router.post('/public/enquiries', (req: AuthedRequest, res) => {
    const schema = z.object({
      propertyId: z.string().trim().optional().nullable(),
      vendorId: z.string().trim().min(1),
      fullName: z.string().trim().min(2).max(100),
      email: z.string().trim().email().max(120),
      phone: z.string().trim().min(7).max(30),
      enquiryType: z.enum(['formal', 'inspection', 'whatsapp_intent']).default('formal'),
      inspectionDate: z.string().trim().max(40).optional(),
      inspectionSession: z.string().trim().max(60).optional(),
      tourPreference: z.string().trim().max(60).optional(),
      purpose: z.string().trim().max(80).optional(),
      message: z.string().trim().max(2000).optional(),
      budgetNote: z.string().trim().max(100).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid enquiry submission.' });
      return;
    }

    const data = parsed.data;
    const vendorRow = db.prepare('SELECT id, user_id, business_name FROM vendor_profiles WHERE id = ?').get(data.vendorId) as
      | { id: string; user_id: string; business_name: string }
      | undefined;
    if (!vendorRow) {
      res.status(404).json({ error: 'Target vendor or agency not found.' });
      return;
    }

    const authed = resolveUser(req);
    const id = `enq_${crypto.randomUUID().slice(0, 10)}`;
    const now = new Date().toISOString();

    db.prepare(
      `INSERT INTO enquiries (
        id, property_id, vendor_id, seeker_id, full_name, email, phone,
        enquiry_type, inspection_date, inspection_session, tour_preference, purpose, message, budget_note, status, created_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'new', ?)`
    ).run(
      id,
      data.propertyId || null,
      data.vendorId,
      authed?.id || null,
      data.fullName,
      data.email.toLowerCase(),
      data.phone,
      data.enquiryType,
      data.inspectionDate || '',
      data.inspectionSession || '',
      data.tourPreference || '',
      data.purpose || 'Purchase / Acquire',
      data.message || '',
      data.budgetNote || '',
      now
    );

    createNotification(
      vendorRow.user_id,
      `New ${data.enquiryType === 'inspection' ? 'Inspection Booking' : 'Buyer Inquiry'}`,
      `${data.fullName} submitted an enquiry (${data.phone}).`,
      '/vendor/leads'
    );

    res.status(201).json({ id, status: 'new', createdAt: now });
  });

  router.post('/public/newsletter', (req, res) => {
    const schema = z.object({ email: z.string().trim().email().max(120) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Enter a valid email address.' });
      return;
    }
    db.prepare('INSERT OR IGNORE INTO newsletter_subscribers (email, created_at) VALUES (?, ?)').run(
      parsed.data.email.toLowerCase(),
      new Date().toISOString()
    );
    res.json({ subscribed: true });
  });

  // ==========================================
  // SEEKER EXPERIENCE
  // ==========================================

  router.get('/seeker/saved', requireAuth, (req: AuthedRequest, res) => {
    const rows = db
      .prepare(
        `SELECT p.*, v.business_name as vendor_name, v.slug as vendor_slug,
                v.verification_status as vendor_verification_status, v.rating as vendor_rating,
                u.phone as vendor_phone
         FROM saved_properties sp
         JOIN properties p ON p.id = sp.property_id
         JOIN vendor_profiles v ON v.id = p.vendor_id
         JOIN users u ON u.id = v.user_id
         WHERE sp.user_id = ?
         ORDER BY sp.created_at DESC`
      )
      .all(req.user!.id) as Record<string, unknown>[];

    res.json({ saved: rows.map(mapPropertyRow) });
  });

  router.post('/seeker/saved/:propertyId', requireAuth, (req: AuthedRequest, res) => {
    const prop = db.prepare('SELECT id FROM properties WHERE id = ?').get(req.params.propertyId);
    if (!prop) {
      res.status(404).json({ error: 'Property not found.' });
      return;
    }
    const exists = db
      .prepare('SELECT 1 FROM saved_properties WHERE user_id = ? AND property_id = ?')
      .get(req.user!.id, req.params.propertyId);

    if (exists) {
      db.prepare('DELETE FROM saved_properties WHERE user_id = ? AND property_id = ?').run(req.user!.id, req.params.propertyId);
      res.json({ saved: false });
    } else {
      db.prepare('INSERT INTO saved_properties (user_id, property_id, created_at) VALUES (?, ?, ?)').run(
        req.user!.id,
        req.params.propertyId,
        new Date().toISOString()
      );
      res.json({ saved: true });
    }
  });

  router.get('/seeker/enquiries', requireAuth, (req: AuthedRequest, res) => {
    const rows = db
      .prepare(
        `SELECT e.*, p.title as property_title, p.ref_code as property_ref, v.business_name as vendor_name
         FROM enquiries e
         LEFT JOIN properties p ON p.id = e.property_id
         JOIN vendor_profiles v ON v.id = e.vendor_id
         WHERE e.seeker_id = ? OR LOWER(e.email) = ?
         ORDER BY e.created_at DESC`
      )
      .all(req.user!.id, req.user!.email.toLowerCase()) as Record<string, unknown>[];

    res.json({
      enquiries: rows.map((r) => ({
        id: String(r.id),
        propertyId: r.property_id ? String(r.property_id) : null,
        propertyTitle: r.property_title ? String(r.property_title) : 'General Agency Inquiry',
        propertyRef: r.property_ref ? String(r.property_ref) : '',
        vendorId: String(r.vendor_id),
        vendorName: String(r.vendor_name),
        fullName: String(r.full_name),
        email: String(r.email),
        phone: String(r.phone),
        enquiryType: String(r.enquiry_type),
        inspectionDate: String(r.inspection_date || ''),
        inspectionSession: String(r.inspection_session || ''),
        tourPreference: String(r.tour_preference || ''),
        purpose: String(r.purpose || ''),
        message: String(r.message || ''),
        status: String(r.status),
        createdAt: String(r.created_at),
      })),
    });
  });

  // ==========================================
  // VENDOR & AGENCY WORKSPACE + 9-STEP WIZARD
  // ==========================================

  router.get('/vendor/overview', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const vendorId = String(vendor.id);
    const subscription = getActiveSubscription(vendorId);

    const props = db
      .prepare(
        `SELECT p.*, (SELECT COUNT(*) FROM enquiries e WHERE e.property_id = p.id) as inquiries_count
         FROM properties p WHERE p.vendor_id = ? ORDER BY p.updated_at DESC`
      )
      .all(vendorId) as Record<string, unknown>[];

    const leads = db
      .prepare(
        `SELECT e.*, p.title as property_title, p.ref_code as property_ref
         FROM enquiries e
         LEFT JOIN properties p ON p.id = e.property_id
         WHERE e.vendor_id = ?
         ORDER BY e.created_at DESC LIMIT 8`
      )
      .all(vendorId) as Record<string, unknown>[];

    const activePromos = db
      .prepare("SELECT COUNT(*) as count FROM property_promotions WHERE vendor_id = ? AND status = 'active' AND expires_at > ?")
      .get(vendorId, new Date().toISOString()) as { count: number };

    const totalViews = props.reduce((sum, p) => sum + Number(p.views_count || 0), 0);
    const totalValueNgn = props.filter((p) => p.status === 'published').reduce((sum, p) => sum + Number(p.price_ngn || 0), 0);
    const totalLeads = db.prepare('SELECT COUNT(*) as count FROM enquiries WHERE vendor_id = ?').get(vendorId) as { count: number };

    res.json({
      vendor,
      subscription,
      stats: {
        totalInventory: props.length,
        publishedCount: props.filter((p) => p.status === 'published').length,
        pendingCount: props.filter((p) => p.status === 'pending_review').length,
        draftCount: props.filter((p) => p.status === 'draft').length,
        totalPortfolioNgn: totalValueNgn,
        totalViews,
        totalLeads: totalLeads.count,
        promotedCount: activePromos.count,
      },
      attentionProperties: props
        .filter((p) => p.status === 'pending_review' || p.status === 'rejected' || p.status === 'draft')
        .slice(0, 4)
        .map(mapPropertyRow),
      topProperties: [...props].sort((a, b) => Number(b.views_count) - Number(a.views_count)).slice(0, 4).map(mapPropertyRow),
      recentLeads: leads.map((r) => ({
        id: String(r.id),
        propertyId: r.property_id ? String(r.property_id) : null,
        propertyTitle: r.property_title ? String(r.property_title) : 'General Agency Portfolio',
        propertyRef: r.property_ref ? String(r.property_ref) : '',
        fullName: String(r.full_name),
        email: String(r.email),
        phone: String(r.phone),
        enquiryType: String(r.enquiry_type),
        inspectionDate: String(r.inspection_date || ''),
        message: String(r.message || ''),
        budgetNote: String(r.budget_note || ''),
        status: String(r.status),
        createdAt: String(r.created_at),
      })),
    });
  });

  router.get('/vendor/properties', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const rows = db
      .prepare(
        `SELECT p.*, v.business_name as vendor_name, v.slug as vendor_slug, v.verification_status as vendor_verification_status,
                (SELECT COUNT(*) FROM enquiries e WHERE e.property_id = p.id) as inquiries_count
         FROM properties p
         JOIN vendor_profiles v ON v.id = p.vendor_id
         WHERE p.vendor_id = ?
         ORDER BY p.updated_at DESC`
      )
      .all(String(vendor.id)) as Record<string, unknown>[];

    res.json({ properties: rows.map(mapPropertyRow) });
  });

  const propertyWriteSchema = z.object({
    title: z.string().trim().min(5).max(160),
    purpose: z.enum(['buy', 'rent', 'lease', 'land_banking', 'buy_build', 'jv']).default('buy'),
    category: z.enum(['residential', 'commercial', 'land_banking', 'buy_build']),
    subcategory: z.string().trim().max(80).default(''),
    description: z.string().trim().max(4000).default(''),
    priceNgn: z.number().nonnegative(),
    priceUnit: z.string().trim().max(40).default('Outright'),
    address: z.string().trim().max(240).default(''),
    corridor: z.string().trim().max(120).default(''),
    lga: z.string().trim().max(80).default(''),
    city: z.string().trim().max(80).default('Lagos'),
    state: z.string().trim().max(80).default('Lagos'),
    latitude: z.number().default(6.4474),
    longitude: z.number().default(3.4731),
    beaconRef: z.string().trim().max(80).default(''),
    bedrooms: z.number().int().min(0).max(100).default(0),
    bathrooms: z.number().int().min(0).max(100).default(0),
    areaSqm: z.number().int().min(0).max(5000000).default(0),
    garageBays: z.number().int().min(0).max(500).default(0),
    yearBuilt: z.number().int().min(1960).max(2030).default(2024),
    smartIot: z.boolean().default(false),
    titleDocType: z.string().trim().max(100).default('Certificate of Occupancy (C of O)'),
    surveyPlanNo: z.string().trim().max(100).default(''),
    bureauFileNo: z.string().trim().max(100).default(''),
    amenities: z.array(z.string()).default([]),
    images: z.array(z.string()).default([]),
    videoUrl: z.string().trim().max(300).default(''),
    submitForReview: z.boolean().default(false),
  });

  function computeListingHealthScore(input: z.infer<typeof propertyWriteSchema>): number {
    let score = 20;
    if (input.title.length >= 15) score += 10;
    if (input.address.length >= 8 && input.state) score += 15;
    if (input.priceNgn > 0) score += 15;
    if (input.description.length >= 40) score += 10;
    if (input.titleDocType && (input.surveyPlanNo || input.bureauFileNo)) score += 15;
    if (input.images.length >= 1) score += 10;
    if (input.images.length >= 3) score += 5;
    return Math.min(100, score);
  }

  router.post('/vendor/properties', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }

    const parsed = propertyWriteSchema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid property listing fields.' });
      return;
    }

    const data = parsed.data;
    const vendorId = String(vendor.id);
    const sub = getActiveSubscription(vendorId);

    if (data.submitForReview) {
      if (!sub) {
        res.status(403).json({ error: 'An active Standard or Premium subscription is required before submitting listings for publication.' });
        return;
      }
      if (vendor.verification_status !== 'verified') {
        res.status(403).json({ error: 'Your KYC / CAC verification must be approved before submitting properties for publication. Saved as draft instead.' });
        return;
      }
      const plan = SUBSCRIPTION_PLANS[sub.planCode];
      if (plan.maxListings !== null) {
        const activeCount = db
          .prepare("SELECT COUNT(*) as count FROM properties WHERE vendor_id = ? AND status IN ('published', 'pending_review')")
          .get(vendorId) as { count: number };
        if (activeCount.count >= plan.maxListings) {
          res.status(403).json({ error: `Standard plan allows up to ${plan.maxListings} active listings. Upgrade to Premium for unlimited listings.` });
          return;
        }
      }
    }

    const id = `prop_${crypto.randomUUID().slice(0, 10)}`;
    const refCode = `TRM-${(data.state.slice(0, 3) || 'LOS').toUpperCase()}-${crypto.randomInt(1000, 9999)}`;
    const slug = `${sanitizeSlug(data.title)}-${crypto.randomBytes(2).toString('hex')}`;
    const healthScore = computeListingHealthScore(data);
    const now = new Date().toISOString();
    const status = data.submitForReview ? 'pending_review' : 'draft';
    const safeImages =
      data.images.length > 0 ? data.images : ['/src/assets/images/prop_lekki_villa_1795687716839.jpg'];

    db.prepare(
      `INSERT INTO properties (
        id, ref_code, vendor_id, title, slug, purpose, category, subcategory, description,
        price_ngn, price_usd, price_unit, address, corridor, lga, city, state,
        latitude, longitude, beacon_ref, bedrooms, bathrooms, area_sqm, garage_bays, year_built,
        smart_iot, title_doc_type, survey_plan_no, bureau_file_no, scuml_cleared, escrow_locked,
        walk_score, amenities_json, images_json, video_url, health_score, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, 0, 84, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      refCode,
      vendorId,
      data.title,
      slug,
      data.purpose,
      data.category,
      data.subcategory,
      data.description,
      Math.round(data.priceNgn),
      data.priceUnit,
      data.address,
      data.corridor || data.city,
      data.lga,
      data.city,
      data.state,
      data.latitude,
      data.longitude,
      data.beaconRef,
      data.bedrooms,
      data.bathrooms,
      data.areaSqm,
      data.garageBays,
      data.yearBuilt,
      data.smartIot ? 1 : 0,
      data.titleDocType,
      data.surveyPlanNo,
      data.bureauFileNo,
      JSON.stringify(data.amenities),
      JSON.stringify(safeImages),
      data.videoUrl,
      healthScore,
      status,
      now,
      now
    );

    const created = db.prepare('SELECT * FROM properties WHERE id = ?').get(id) as Record<string, unknown>;
    res.status(201).json({ property: mapPropertyRow(created) });
  });

  router.patch('/vendor/properties/:id', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const existing = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id) as Record<string, unknown> | undefined;
    if (!existing || String(existing.vendor_id) !== String(vendor.id)) {
      res.status(403).json({ error: 'You do not have permission to edit this property.' });
      return;
    }

    const parsed = propertyWriteSchema.partial().safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid update fields.' });
      return;
    }
    const d = parsed.data;
    const priceNgn = d.priceNgn !== undefined ? Math.round(d.priceNgn) : Number(existing.price_ngn);
    const now = new Date().toISOString();

    let nextStatus = String(existing.status);
    if (d.submitForReview) {
      const sub = getActiveSubscription(String(vendor.id));
      if (!sub) {
        res.status(403).json({ error: 'An active subscription is required to submit listings for review.' });
        return;
      }
      if (vendor.verification_status !== 'verified') {
        res.status(403).json({ error: 'KYC verification must be approved before publishing properties.' });
        return;
      }
      nextStatus = 'pending_review';
    }

    db.prepare(
      `UPDATE properties SET
        title = COALESCE(?, title),
        purpose = COALESCE(?, purpose),
        category = COALESCE(?, category),
        subcategory = COALESCE(?, subcategory),
        description = COALESCE(?, description),
        price_ngn = ?,
        price_unit = COALESCE(?, price_unit),
        address = COALESCE(?, address),
        corridor = COALESCE(?, corridor),
        lga = COALESCE(?, lga),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        latitude = COALESCE(?, latitude),
        longitude = COALESCE(?, longitude),
        beacon_ref = COALESCE(?, beacon_ref),
        bedrooms = COALESCE(?, bedrooms),
        bathrooms = COALESCE(?, bathrooms),
        area_sqm = COALESCE(?, area_sqm),
        garage_bays = COALESCE(?, garage_bays),
        year_built = COALESCE(?, year_built),
        smart_iot = COALESCE(?, smart_iot),
        title_doc_type = COALESCE(?, title_doc_type),
        survey_plan_no = COALESCE(?, survey_plan_no),
        bureau_file_no = COALESCE(?, bureau_file_no),
        amenities_json = COALESCE(?, amenities_json),
        images_json = COALESCE(?, images_json),
        video_url = COALESCE(?, video_url),
        status = ?,
        updated_at = ?
      WHERE id = ?`
    ).run(
      d.title ?? null,
      d.purpose ?? null,
      d.category ?? null,
      d.subcategory ?? null,
      d.description ?? null,
      priceNgn,
      d.priceUnit ?? null,
      d.address ?? null,
      d.corridor ?? null,
      d.lga ?? null,
      d.city ?? null,
      d.state ?? null,
      d.latitude ?? null,
      d.longitude ?? null,
      d.beaconRef ?? null,
      d.bedrooms ?? null,
      d.bathrooms ?? null,
      d.areaSqm ?? null,
      d.garageBays ?? null,
      d.yearBuilt ?? null,
      d.smartIot !== undefined ? (d.smartIot ? 1 : 0) : null,
      d.titleDocType ?? null,
      d.surveyPlanNo ?? null,
      d.bureauFileNo ?? null,
      d.amenities ? JSON.stringify(d.amenities) : null,
      d.images ? JSON.stringify(d.images) : null,
      d.videoUrl ?? null,
      nextStatus,
      now,
      req.params.id
    );

    const updated = db.prepare('SELECT * FROM properties WHERE id = ?').get(req.params.id) as Record<string, unknown>;
    res.json({ property: mapPropertyRow(updated) });
  });

  router.post('/vendor/properties/bulk', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const schema = z.object({
      propertyIds: z.array(z.string()).min(1).max(50),
      action: z.enum(['mark_sold', 'move_to_draft']),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid bulk action request.' });
      return;
    }
    const nextStatus = parsed.data.action === 'mark_sold' ? 'sold' : 'draft';
    const stmt = db.prepare('UPDATE properties SET status = ?, updated_at = ? WHERE id = ? AND vendor_id = ?');
    const now = new Date().toISOString();
    let affected = 0;
    for (const pid of parsed.data.propertyIds) {
      const info = stmt.run(nextStatus, now, pid, String(vendor.id));
      affected += Number(info.changes || 0);
    }
    res.json({ affected, status: nextStatus });
  });

  router.delete('/vendor/properties/:id', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const info = db.prepare('DELETE FROM properties WHERE id = ? AND vendor_id = ?').run(req.params.id, String(vendor.id));
    if (!info.changes) {
      res.status(404).json({ error: 'Property not found or unauthorized.' });
      return;
    }
    res.json({ deleted: true });
  });

  router.get('/vendor/enquiries', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const rows = db
      .prepare(
        `SELECT e.*, p.title as property_title, p.ref_code as property_ref
         FROM enquiries e
         LEFT JOIN properties p ON p.id = e.property_id
         WHERE e.vendor_id = ?
         ORDER BY e.created_at DESC`
      )
      .all(String(vendor.id)) as Record<string, unknown>[];

    res.json({
      enquiries: rows.map((r) => ({
        id: String(r.id),
        propertyId: r.property_id ? String(r.property_id) : null,
        propertyTitle: r.property_title ? String(r.property_title) : 'General Agency Portfolio',
        propertyRef: r.property_ref ? String(r.property_ref) : '',
        vendorId: String(r.vendor_id),
        fullName: String(r.full_name),
        email: String(r.email),
        phone: String(r.phone),
        enquiryType: String(r.enquiry_type),
        inspectionDate: String(r.inspection_date || ''),
        inspectionSession: String(r.inspection_session || ''),
        tourPreference: String(r.tour_preference || ''),
        purpose: String(r.purpose || ''),
        message: String(r.message || ''),
        budgetNote: String(r.budget_note || ''),
        status: String(r.status),
        createdAt: String(r.created_at),
      })),
    });
  });

  router.patch('/vendor/enquiries/:id', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const schema = z.object({ status: z.enum(['new', 'responded', 'scheduled', 'closed']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }
    const info = db
      .prepare('UPDATE enquiries SET status = ? WHERE id = ? AND vendor_id = ?')
      .run(parsed.data.status, req.params.id, String(vendor.id));
    if (!info.changes) {
      res.status(404).json({ error: 'Enquiry not found or unauthorized.' });
      return;
    }
    res.json({ updated: true, status: parsed.data.status });
  });

  router.get('/vendor/kyc', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const docs = db
      .prepare('SELECT * FROM kyc_documents WHERE vendor_id = ? ORDER BY created_at DESC')
      .all(String(vendor.id)) as Record<string, unknown>[];

    res.json({
      verificationStatus: String(vendor.verification_status),
      verificationNotes: String(vendor.verification_notes || ''),
      rcNumber: String(vendor.rc_number || ''),
      tinNumber: String(vendor.tin_number || ''),
      scumlNumber: String(vendor.scuml_number || ''),
      documents: docs.map((d) => ({
        id: String(d.id),
        vendorId: String(d.vendor_id),
        docType: String(d.doc_type),
        docLabel: String(d.doc_label),
        fileName: String(d.file_name),
        fileUrl: String(d.file_url),
        status: String(d.status),
        reviewerNote: String(d.reviewer_note || ''),
        createdAt: String(d.created_at),
      })),
    });
  });

  router.post('/vendor/kyc', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const schema = z.object({
      rcNumber: z.string().trim().max(60).optional(),
      tinNumber: z.string().trim().max(60).optional(),
      scumlNumber: z.string().trim().max(60).optional(),
      documents: z
        .array(
          z.object({
            docType: z.enum(['representative_id', 'cac_cert', 'cac_form_1_1', 'scuml_cert', 'other']),
            docLabel: z.string().trim().min(2).max(120),
            fileName: z.string().trim().min(2).max(160),
            fileUrl: z.string().trim().min(1).max(300),
          })
        )
        .default([]),
    });

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid KYC submission.' });
      return;
    }

    const d = parsed.data;
    const vendorId = String(vendor.id);
    const now = new Date().toISOString();

    db.prepare(
      `UPDATE vendor_profiles
       SET rc_number = COALESCE(NULLIF(?, ''), rc_number),
           tin_number = COALESCE(NULLIF(?, ''), tin_number),
           scuml_number = COALESCE(NULLIF(?, ''), scuml_number),
           verification_status = 'pending'
       WHERE id = ?`
    ).run(d.rcNumber || '', d.tinNumber || '', d.scumlNumber || '', vendorId);

    const insertDoc = db.prepare(
      `INSERT INTO kyc_documents (id, vendor_id, doc_type, doc_label, file_name, file_url, status, created_at)
       VALUES (?, ?, ?, ?, ?, ?, 'pending', ?)`
    );
    for (const doc of d.documents) {
      insertDoc.run(`kyc_${crypto.randomUUID().slice(0, 10)}`, vendorId, doc.docType, doc.docLabel, doc.fileName, doc.fileUrl, now);
    }

    res.json({ submitted: true, verificationStatus: 'pending' });
  });

  router.patch('/vendor/profile', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const schema = z.object({
      businessName: z.string().trim().min(2).max(120).optional(),
      representativeName: z.string().trim().min(2).max(100).optional(),
      representativeRole: z.string().trim().max(80).optional(),
      address: z.string().trim().max(200).optional(),
      abujaAddress: z.string().trim().max(200).optional(),
      city: z.string().trim().max(80).optional(),
      state: z.string().trim().max(80).optional(),
      bio: z.string().trim().max(2000).optional(),
      logoUrl: z.string().trim().max(300).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid profile update.' });
      return;
    }
    const d = parsed.data;
    db.prepare(
      `UPDATE vendor_profiles SET
        business_name = COALESCE(?, business_name),
        representative_name = COALESCE(?, representative_name),
        representative_role = COALESCE(?, representative_role),
        address = COALESCE(?, address),
        abuja_address = COALESCE(?, abuja_address),
        city = COALESCE(?, city),
        state = COALESCE(?, state),
        bio = COALESCE(?, bio),
        logo_url = COALESCE(?, logo_url)
       WHERE id = ?`
    ).run(
      d.businessName ?? null,
      d.representativeName ?? null,
      d.representativeRole ?? null,
      d.address ?? null,
      d.abujaAddress ?? null,
      d.city ?? null,
      d.state ?? null,
      d.bio ?? null,
      d.logoUrl ?? null,
      String(vendor.id)
    );
    res.json({ updated: true });
  });

  router.get('/vendor/team', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const rows = db.prepare('SELECT * FROM agency_team_members WHERE vendor_id = ?').all(String(vendor.id)) as Record<string, unknown>[];
    res.json({
      team: rows.map((t) => ({
        id: String(t.id),
        vendorId: String(t.vendor_id),
        fullName: String(t.full_name),
        title: String(t.title),
        credentials: String(t.credentials || ''),
        bio: String(t.bio || ''),
        avatarUrl: String(t.avatar_url || ''),
        phone: String(t.phone || ''),
        email: String(t.email || ''),
      })),
    });
  });

  router.post('/vendor/team', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const schema = z.object({
      fullName: z.string().trim().min(2).max(100),
      title: z.string().trim().min(2).max(100),
      credentials: z.string().trim().max(120).default(''),
      bio: z.string().trim().max(400).default(''),
      phone: z.string().trim().max(30).default(''),
      email: z.string().trim().email().max(120).optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Valid name and title required for team member.' });
      return;
    }
    const id = `tm_${crypto.randomUUID().slice(0, 8)}`;
    db.prepare(
      `INSERT INTO agency_team_members (id, vendor_id, full_name, title, credentials, bio, avatar_url, phone, email)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`
    ).run(
      id,
      String(vendor.id),
      parsed.data.fullName,
      parsed.data.title,
      parsed.data.credentials,
      parsed.data.bio,
      '/src/assets/images/avatar_chief_emeka_1795687719662.jpg',
      parsed.data.phone,
      parsed.data.email || ''
    );
    res.status(201).json({ id });
  });

  router.delete('/vendor/team/:memberId', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    db.prepare('DELETE FROM agency_team_members WHERE id = ? AND vendor_id = ?').run(req.params.memberId, String(vendor.id));
    res.json({ deleted: true });
  });

  // ==========================================
  // SECURE LOCAL FILE UPLOADS (SANDBOX STORAGE)
  // ==========================================

  router.post('/uploads', requireAuth, (req: AuthedRequest, res) => {
    const schema = z.object({
      fileName: z.string().trim().min(1).max(140),
      mimeType: z.enum(['image/png', 'image/jpeg', 'image/webp', 'application/pdf']),
      dataBase64: z.string().min(10).max(7_000_000),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Allowed formats: PNG, JPG, WEBP, PDF (max 5MB).' });
      return;
    }

    const extMap: Record<string, string> = {
      'image/png': '.png',
      'image/jpeg': '.jpg',
      'image/webp': '.webp',
      'application/pdf': '.pdf',
    };
    const ext = extMap[parsed.data.mimeType];
    const generatedName = `${Date.now()}-${crypto.randomUUID().slice(0, 8)}${ext}`;
    const targetPath = safeUploadPath(UPLOADS_DIR, generatedName);
    if (!targetPath) {
      res.status(400).json({ error: 'Invalid file path.' });
      return;
    }

    const cleanBase64 = parsed.data.dataBase64.replace(/^data:[^;]+;base64,/, '');
    const buffer = Buffer.from(cleanBase64, 'base64');
    if (buffer.length > 5 * 1024 * 1024) {
      res.status(400).json({ error: 'File exceeds 5MB upload limit.' });
      return;
    }
    fs.writeFileSync(targetPath, buffer);

    res.status(201).json({
      fileName: parsed.data.fileName,
      fileUrl: `/uploads/${generatedName}`,
      sizeBytes: buffer.length,
    });
  });

  // ==========================================
  // SUBSCRIPTIONS, PROMOTIONS & SIGNED WEBHOOKS
  // ==========================================

  router.get('/billing/overview', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const vendorId = String(vendor.id);
    const subscription = getActiveSubscription(vendorId);
    const orders = db
      .prepare('SELECT * FROM payment_orders WHERE vendor_id = ? ORDER BY created_at DESC LIMIT 20')
      .all(vendorId) as Record<string, unknown>[];
    const promotions = db
      .prepare(
        `SELECT pp.*, p.title as property_title, p.ref_code as property_ref
         FROM property_promotions pp
         JOIN properties p ON p.id = pp.property_id
         WHERE pp.vendor_id = ?
         ORDER BY pp.created_at DESC LIMIT 20`
      )
      .all(vendorId) as Record<string, unknown>[];

    res.json({
      subscription,
      orders: orders.map((o) => ({
        id: String(o.id),
        reference: String(o.reference),
        orderType: String(o.order_type),
        targetId: String(o.target_id),
        paymentMethod: String(o.payment_method),
        subtotalNgn: Number(o.subtotal_ngn),
        discountNgn: Number(o.discount_ngn),
        vatNgn: Number(o.vat_ngn),
        totalNgn: Number(o.total_ngn),
        status: String(o.status),
        createdAt: String(o.created_at),
        verifiedAt: o.verified_at ? String(o.verified_at) : null,
      })),
      promotions: promotions.map((pm) => ({
        id: String(pm.id),
        propertyId: String(pm.property_id),
        propertyTitle: String(pm.property_title),
        propertyRef: String(pm.property_ref),
        packageCode: String(pm.package_code),
        status: String(pm.status),
        startsAt: String(pm.starts_at),
        expiresAt: String(pm.expires_at),
        viewsGenerated: Number(pm.views_generated),
        leadsGenerated: Number(pm.leads_generated),
        createdAt: String(pm.created_at),
      })),
    });
  });

  router.post('/billing/orders', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }

    const schema = z.discriminatedUnion('orderType', [
      z.object({
        orderType: z.literal('subscription'),
        planCode: z.enum(['standard', 'premium']),
        billingMonths: z.union([z.literal(1), z.literal(3), z.literal(6), z.literal(12)]),
        paymentMethod: z.enum(['card', 'bank_transfer']),
        idempotencyKey: z.string().trim().min(6).max(120),
      }),
      z.object({
        orderType: z.literal('promotion'),
        propertyId: z.string().trim().min(1),
        packageCode: z.enum(['promo_1w', 'promo_2w', 'promo_1m']),
        paymentMethod: z.enum(['card', 'bank_transfer']),
        idempotencyKey: z.string().trim().min(6).max(120),
      }),
    ]);

    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: parsed.error.issues[0]?.message || 'Invalid checkout order.' });
      return;
    }

    const data = parsed.data;
    const vendorId = String(vendor.id);

    // Check idempotency key so retries return existing order
    const existingOrder = db
      .prepare('SELECT * FROM payment_orders WHERE idempotency_key = ?')
      .get(data.idempotencyKey) as Record<string, unknown> | undefined;
    if (existingOrder) {
      res.json({
        order: {
          id: String(existingOrder.id),
          reference: String(existingOrder.reference),
          status: String(existingOrder.status),
          totalNgn: Number(existingOrder.total_ngn),
        },
        deduplicated: true,
      });
      return;
    }

    const now = new Date().toISOString();
    const orderId = `ord_${crypto.randomUUID().slice(0, 10)}`;
    const reference = `TRM-PAY-${crypto.randomInt(100000, 999999)}`;

    if (data.orderType === 'subscription') {
      const quote = calculateSubscriptionQuote(data.planCode, data.billingMonths);
      const subId = `sub_${crypto.randomUUID().slice(0, 10)}`;
      const exp = new Date(Date.now() + data.billingMonths * 30 * 24 * 60 * 60 * 1000).toISOString();

      db.prepare(
        `INSERT INTO subscriptions (id, vendor_id, plan_code, billing_months, status, starts_at, expires_at, auto_renew, created_at)
         VALUES (?, ?, ?, ?, 'pending_payment', ?, ?, 1, ?)`
      ).run(subId, vendorId, data.planCode, data.billingMonths, now, exp, now);

      db.prepare(
        `INSERT INTO payment_orders (
          id, reference, user_id, vendor_id, order_type, target_id, payment_method,
          subtotal_ngn, discount_ngn, vat_ngn, total_ngn, total_usd, status, idempotency_key, created_at
        ) VALUES (?, ?, ?, ?, 'subscription', ?, ?, ?, ?, ?, ?, 0, 'pending', ?, ?)`
      ).run(
        orderId,
        reference,
        req.user!.id,
        vendorId,
        subId,
        data.paymentMethod,
        quote.grossNgn,
        quote.discountNgn,
        quote.vatNgn,
        quote.totalNgn,
        data.idempotencyKey,
        now
      );

      res.status(201).json({
        order: {
          id: orderId,
          reference,
          orderType: 'subscription',
          targetId: subId,
          status: 'pending',
          subtotalNgn: quote.grossNgn,
          discountNgn: quote.discountNgn,
          vatNgn: quote.vatNgn,
          totalNgn: quote.totalNgn,
        },
      });
      return;
    }

    // Promotion order
    const prop = db.prepare('SELECT id, vendor_id FROM properties WHERE id = ?').get(data.propertyId) as
      | { id: string; vendor_id: string }
      | undefined;
    if (!prop || prop.vendor_id !== vendorId) {
      res.status(403).json({ error: 'Property not found or not owned by your account.' });
      return;
    }

    const quote = calculatePromotionQuote(data.packageCode);
    const promoId = `pmo_${crypto.randomUUID().slice(0, 10)}`;
    const exp = new Date(Date.now() + quote.pkg.durationDays * 24 * 60 * 60 * 1000).toISOString();

    db.prepare(
      `INSERT INTO property_promotions (id, property_id, vendor_id, package_code, status, starts_at, expires_at, created_at)
       VALUES (?, ?, ?, ?, 'pending_payment', ?, ?, ?)`
    ).run(promoId, prop.id, vendorId, data.packageCode, now, exp, now);

    db.prepare(
      `INSERT INTO payment_orders (
        id, reference, user_id, vendor_id, order_type, target_id, payment_method,
        subtotal_ngn, discount_ngn, vat_ngn, total_ngn, total_usd, status, idempotency_key, created_at
      ) VALUES (?, ?, ?, ?, 'promotion', ?, ?, ?, 0, ?, ?, 0, 'pending', ?, ?)`
    ).run(
      orderId,
      reference,
      req.user!.id,
      vendorId,
      promoId,
      data.paymentMethod,
      quote.netNgn,
      quote.vatNgn,
      quote.totalNgn,
      data.idempotencyKey,
      now
    );

    res.status(201).json({
      order: {
        id: orderId,
        reference,
        orderType: 'promotion',
        targetId: promoId,
        status: 'pending',
        subtotalNgn: quote.netNgn,
        discountNgn: 0,
        vatNgn: quote.vatNgn,
        totalNgn: quote.totalNgn,
      },
    });
  });

  // Sandbox Gateway Trigger (authenticates vendor owner, signs webhook payload server-side, and executes webhook handler)
  router.post('/billing/sandbox-confirm/:reference', requireAuth, requireRoles('vendor', 'agency'), (req: AuthedRequest, res) => {
    const vendor = getVendorByUserId(req.user!.id);
    if (!vendor) {
      res.status(404).json({ error: 'Vendor profile not found.' });
      return;
    }
    const order = db.prepare('SELECT * FROM payment_orders WHERE reference = ?').get(req.params.reference) as
      | Record<string, unknown>
      | undefined;
    if (!order || String(order.vendor_id) !== String(vendor.id)) {
      res.status(404).json({ error: 'Payment order not found.' });
      return;
    }

    const webhookPayloadObj = {
      eventId: `evt_sandbox_${order.reference}`,
      eventType: 'charge.verified',
      reference: String(order.reference),
      amountNgn: Number(order.total_ngn),
      sandbox: true,
    };
    const rawPayload = JSON.stringify(webhookPayloadObj);
    const signature = signWebhookPayload(rawPayload);
    const result = processVerifiedWebhook(rawPayload, signature);
    res.json(result);
  });

  // Public Signed Webhook Receiver (for external Paystack/Flutterwave signed callbacks)
  router.post('/billing/webhook', (req: AuthedRequest, res) => {
    const rawPayload = req.rawBody || JSON.stringify(req.body);
    const sigHeader = req.headers['x-trem-signature'] as string | undefined;
    if (!verifyWebhookSignature(rawPayload, sigHeader)) {
      res.status(401).json({ error: 'Invalid webhook signature.' });
      return;
    }
    const result = processVerifiedWebhook(rawPayload, sigHeader || '');
    res.json(result);
  });

  function processVerifiedWebhook(rawPayload: string, signature: string) {
    const payload = JSON.parse(rawPayload) as {
      eventId: string;
      eventType: string;
      reference: string;
      amountNgn: number;
    };
    const sigValid = verifyWebhookSignature(rawPayload, signature);
    if (!sigValid) {
      return { verified: false, error: 'Signature verification failed' };
    }

    // Idempotency guard for duplicate webhook deliveries
    const existingEvent = db.prepare('SELECT id FROM payment_events WHERE event_id = ?').get(payload.eventId);
    if (existingEvent) {
      return { verified: true, duplicateIgnored: true, reference: payload.reference };
    }

    const order = db.prepare('SELECT * FROM payment_orders WHERE reference = ?').get(payload.reference) as
      | Record<string, unknown>
      | undefined;
    if (!order) {
      return { verified: false, error: 'Order not found' };
    }

    const now = new Date().toISOString();
    db.prepare(
      `INSERT INTO payment_events (id, order_reference, event_id, event_type, signature_valid, payload_json, processed_at)
       VALUES (?, ?, ?, ?, 1, ?, ?)`
    ).run(`pevt_${crypto.randomUUID().slice(0, 10)}`, payload.reference, payload.eventId, payload.eventType, rawPayload, now);

    if (payload.eventType === 'charge.verified' && Number(payload.amountNgn) === Number(order.total_ngn)) {
      db.prepare("UPDATE payment_orders SET status = 'verified', verified_at = ? WHERE id = ?").run(now, String(order.id));

      if (order.order_type === 'subscription') {
        db.prepare("UPDATE subscriptions SET status = 'active' WHERE id = ?").run(String(order.target_id));
        createNotification(
          String(order.user_id),
          'Subscription Activated',
          `Payment ${payload.reference} verified. Your TREM vendor subscription is now active.`,
          '/vendor/billing'
        );
      } else if (order.order_type === 'promotion') {
        db.prepare("UPDATE property_promotions SET status = 'active' WHERE id = ?").run(String(order.target_id));
        const promoRow = db.prepare('SELECT property_id, package_code FROM property_promotions WHERE id = ?').get(String(order.target_id)) as
          | { property_id: string; package_code: string }
          | undefined;
        if (promoRow) {
          db.prepare('UPDATE properties SET is_promoted = 1, promotion_tier = ? WHERE id = ?').run(
            promoRow.package_code,
            promoRow.property_id
          );
        }
        createNotification(
          String(order.user_id),
          'Property Promotion Live',
          `Promotion package activated for order ${payload.reference}.`,
          '/vendor/promote'
        );
      }
      return { verified: true, activated: true, reference: payload.reference };
    }

    return { verified: true, activated: false, reference: payload.reference };
  }

  // ==========================================
  // NOTIFICATIONS
  // ==========================================

  router.get('/notifications', requireAuth, (req: AuthedRequest, res) => {
    const rows = db
      .prepare('SELECT * FROM notifications WHERE user_id = ? ORDER BY created_at DESC LIMIT 20')
      .all(req.user!.id) as Record<string, unknown>[];
    res.json({
      notifications: rows.map((n) => ({
        id: String(n.id),
        userId: String(n.user_id),
        title: String(n.title),
        body: String(n.body),
        link: String(n.link || '/'),
        isRead: Boolean(n.is_read),
        createdAt: String(n.created_at),
      })),
    });
  });

  router.post('/notifications/read-all', requireAuth, (req: AuthedRequest, res) => {
    db.prepare('UPDATE notifications SET is_read = 1 WHERE user_id = ?').run(req.user!.id);
    res.json({ ok: true });
  });

  // ==========================================
  // PLATFORM ADMINISTRATION (ROLE: ADMIN ONLY)
  // ==========================================

  router.get('/admin/overview', requireAuth, requireRoles('admin'), (_req, res) => {
    const usersCount = (db.prepare('SELECT COUNT(*) as c FROM users').get() as { c: number }).c;
    const vendorsPending = (db.prepare("SELECT COUNT(*) as c FROM vendor_profiles WHERE verification_status = 'pending'").get() as { c: number }).c;
    const listingsPending = (db.prepare("SELECT COUNT(*) as c FROM properties WHERE status = 'pending_review'").get() as { c: number }).c;
    const listingsPublished = (db.prepare("SELECT COUNT(*) as c FROM properties WHERE status = 'published'").get() as { c: number }).c;
    const revenueNgn = (db.prepare("SELECT COALESCE(SUM(total_ngn), 0) as s FROM payment_orders WHERE status = 'verified'").get() as { s: number }).s;
    const enquiriesCount = (db.prepare('SELECT COUNT(*) as c FROM enquiries').get() as { c: number }).c;

    res.json({
      metrics: {
        usersCount,
        vendorsPending,
        listingsPending,
        listingsPublished,
        revenueNgn,
        enquiriesCount,
      },
    });
  });

  router.get('/admin/users', requireAuth, requireRoles('admin'), (_req, res) => {
    const rows = db
      .prepare('SELECT id, email, first_name, last_name, phone, role, status, email_verified, created_at FROM users ORDER BY created_at DESC')
      .all() as Record<string, unknown>[];
    res.json({
      users: rows.map((u) => ({
        id: String(u.id),
        email: String(u.email),
        firstName: String(u.first_name),
        lastName: String(u.last_name),
        phone: String(u.phone),
        role: String(u.role),
        status: String(u.status),
        emailVerified: Boolean(u.email_verified),
        createdAt: String(u.created_at),
      })),
    });
  });

  router.post('/admin/users/:userId/status', requireAuth, requireRoles('admin'), (req: AuthedRequest, res) => {
    const schema = z.object({ status: z.enum(['active', 'suspended']) });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid status.' });
      return;
    }
    if (req.params.userId === req.user!.id) {
      res.status(400).json({ error: 'Cannot suspend your own administrator account.' });
      return;
    }
    db.prepare('UPDATE users SET status = ? WHERE id = ?').run(parsed.data.status, req.params.userId);
    writeAuditLog(req.user!.id, 'admin', `USER_${parsed.data.status.toUpperCase()}`, 'user', String(req.params.userId), '');
    res.json({ updated: true });
  });

  router.get('/admin/vendors', requireAuth, requireRoles('admin'), (_req, res) => {
    const vendors = db
      .prepare(
        `SELECT v.*, u.email, u.phone
         FROM vendor_profiles v
         JOIN users u ON u.id = v.user_id
         ORDER BY v.verification_status = 'pending' DESC, v.created_at DESC`
      )
      .all() as Record<string, unknown>[];

    const docs = db.prepare('SELECT * FROM kyc_documents ORDER BY created_at DESC').all() as Record<string, unknown>[];

    res.json({
      vendors: vendors.map((v) => ({
        id: String(v.id),
        userId: String(v.user_id),
        entityType: String(v.entity_type),
        businessName: String(v.business_name),
        representativeName: String(v.representative_name),
        email: String(v.email),
        phone: String(v.phone),
        rcNumber: String(v.rc_number || ''),
        tinNumber: String(v.tin_number || ''),
        scumlNumber: String(v.scuml_number || ''),
        verificationStatus: String(v.verification_status),
        verificationNotes: String(v.verification_notes || ''),
        documents: docs
          .filter((d) => String(d.vendor_id) === String(v.id))
          .map((d) => ({
            id: String(d.id),
            docType: String(d.doc_type),
            docLabel: String(d.doc_label),
            fileName: String(d.file_name),
            fileUrl: String(d.file_url),
            status: String(d.status),
          })),
      })),
    });
  });

  router.post('/admin/vendors/:vendorId/verify', requireAuth, requireRoles('admin'), (req: AuthedRequest, res) => {
    const schema = z.object({
      decision: z.enum(['verified', 'rejected']),
      notes: z.string().trim().max(400).default(''),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid verification decision.' });
      return;
    }
    const vendor = db.prepare('SELECT id, user_id, business_name FROM vendor_profiles WHERE id = ?').get(req.params.vendorId) as
      | { id: string; user_id: string; business_name: string }
      | undefined;
    if (!vendor) {
      res.status(404).json({ error: 'Vendor not found.' });
      return;
    }

    db.prepare('UPDATE vendor_profiles SET verification_status = ?, verification_notes = ? WHERE id = ?').run(
      parsed.data.decision,
      parsed.data.notes,
      vendor.id
    );
    db.prepare('UPDATE kyc_documents SET status = ?, reviewer_note = ? WHERE vendor_id = ?').run(
      parsed.data.decision === 'verified' ? 'approved' : 'rejected',
      parsed.data.notes,
      vendor.id
    );

    createNotification(
      vendor.user_id,
      parsed.data.decision === 'verified' ? 'Vendor Verification Approved' : 'Verification Update Required',
      parsed.data.notes || `Your verification status for ${vendor.business_name} is now ${parsed.data.decision}.`,
      '/vendor/kyc'
    );
    writeAuditLog(
      req.user!.id,
      'admin',
      `VENDOR_${parsed.data.decision.toUpperCase()}`,
      'vendor_profile',
      vendor.id,
      parsed.data.notes
    );
    res.json({ updated: true, verificationStatus: parsed.data.decision });
  });

  router.get('/admin/listings', requireAuth, requireRoles('admin'), (_req, res) => {
    const rows = db
      .prepare(
        `SELECT p.*, v.business_name as vendor_name, v.slug as vendor_slug, v.verification_status as vendor_verification_status
         FROM properties p
         JOIN vendor_profiles v ON v.id = p.vendor_id
         ORDER BY p.status = 'pending_review' DESC, p.updated_at DESC`
      )
      .all() as Record<string, unknown>[];
    res.json({ listings: rows.map(mapPropertyRow) });
  });

  router.post('/admin/listings/:propertyId/moderate', requireAuth, requireRoles('admin'), (req: AuthedRequest, res) => {
    const schema = z.object({
      status: z.enum(['published', 'rejected', 'suspended']),
      note: z.string().trim().max(400).default(''),
      isFeatured: z.boolean().optional(),
    });
    const parsed = schema.safeParse(req.body);
    if (!parsed.success) {
      res.status(400).json({ error: 'Invalid moderation action.' });
      return;
    }
    const prop = db
      .prepare(
        `SELECT p.id, p.title, p.vendor_id, v.user_id
         FROM properties p JOIN vendor_profiles v ON v.id = p.vendor_id
         WHERE p.id = ?`
      )
      .get(req.params.propertyId) as { id: string; title: string; vendor_id: string; user_id: string } | undefined;

    if (!prop) {
      res.status(404).json({ error: 'Listing not found.' });
      return;
    }

    db.prepare(
      `UPDATE properties SET status = ?, moderation_note = ?, is_featured = COALESCE(?, is_featured), updated_at = ? WHERE id = ?`
    ).run(
      parsed.data.status,
      parsed.data.note,
      parsed.data.isFeatured !== undefined ? (parsed.data.isFeatured ? 1 : 0) : null,
      new Date().toISOString(),
      prop.id
    );

    createNotification(
      prop.user_id,
      `Listing ${parsed.data.status === 'published' ? 'Published' : parsed.data.status}`,
      `${prop.title} was reviewed by TREM Moderation.${parsed.data.note ? ` Note: ${parsed.data.note}` : ''}`,
      '/vendor/properties'
    );
    writeAuditLog(
      req.user!.id,
      'admin',
      `LISTING_${parsed.data.status.toUpperCase()}`,
      'property',
      prop.id,
      parsed.data.note
    );
    res.json({ updated: true, status: parsed.data.status });
  });

  router.get('/admin/commercial', requireAuth, requireRoles('admin'), (_req, res) => {
    const subscriptions = db
      .prepare(
        `SELECT s.*, v.business_name
         FROM subscriptions s JOIN vendor_profiles v ON v.id = s.vendor_id
         ORDER BY s.created_at DESC LIMIT 30`
      )
      .all() as Record<string, unknown>[];
    const orders = db
      .prepare(
        `SELECT po.*, v.business_name
         FROM payment_orders po JOIN vendor_profiles v ON v.id = po.vendor_id
         ORDER BY po.created_at DESC LIMIT 30`
      )
      .all() as Record<string, unknown>[];
    const promotions = db
      .prepare(
        `SELECT pp.*, p.title as property_title, v.business_name
         FROM property_promotions pp
         JOIN properties p ON p.id = pp.property_id
         JOIN vendor_profiles v ON v.id = pp.vendor_id
         ORDER BY pp.created_at DESC LIMIT 30`
      )
      .all() as Record<string, unknown>[];

    res.json({ subscriptions, orders, promotions });
  });

  router.get('/admin/audit-logs', requireAuth, requireRoles('admin'), (_req, res) => {
    const logs = db.prepare('SELECT * FROM audit_logs ORDER BY created_at DESC LIMIT 60').all() as Record<string, unknown>[];
    res.json({
      logs: logs.map((l) => ({
        id: String(l.id),
        actorUserId: String(l.actor_user_id),
        actorRole: String(l.actor_role),
        action: String(l.action),
        targetType: String(l.target_type),
        targetId: String(l.target_id),
        details: String(l.details || ''),
        createdAt: String(l.created_at),
      })),
    });
  });

  return router;
}
