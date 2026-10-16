/**
 * KMFRI Enterprise Services Hub — API server
 *
 *   npm run server        API on API_PORT (default 4000); Vite dev proxies /api here
 *   npm start             serves the built site (dist/) plus the API — run `npm run build` first
 */
import fs from 'node:fs';
import path from 'node:path';
import express, { type NextFunction, type Request, type Response } from 'express';
import type { RowDataPacket } from 'mysql2/promise';
import { pool, config } from './db';
import { listServices, listStations, listCharter } from './repository';

const app = express();
app.disable('x-powered-by');
app.use(express.json({ limit: '20kb' }));
app.use((_req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

const wrap =
  (fn: (req: Request, res: Response) => Promise<unknown>) =>
  (req: Request, res: Response, next: NextFunction) =>
    fn(req, res).catch(next);

/* ------------------------------ Read API ------------------------------ */
app.get('/api/health', wrap(async (_req, res) => {
  const [[row]] = (await pool.query('SELECT VERSION() AS version, DATABASE() AS db')) as any;
  res.json({ ok: true, database: row.db, server: row.version });
}));

app.get('/api/services', wrap(async (_req, res) => {
  res.json(await listServices());
}));

app.get('/api/services/:slug', wrap(async (req, res) => {
  const service = (await listServices()).find((s) => s.slug === req.params.slug);
  if (!service) return res.status(404).json({ error: 'Service not found' });
  res.json(service);
}));

app.get('/api/stations', wrap(async (_req, res) => {
  res.json(await listStations());
}));

app.get('/api/charter', wrap(async (_req, res) => {
  res.json(await listCharter());
}));

/* ------------------------- Quotation requests ------------------------- */
const CLIENT_TYPES = ['government', 'county', 'private', 'researcher', 'university', 'sme', 'individual'] as const;
const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;
const PHONE_RE = /^\+?[\d\s()\-]{7,30}$/;
const KRA_RE = /^[A-Z]\d{9}[A-Z]$/;

// Simple per-IP throttle for public submissions (10 per 10 minutes)
const submissions = new Map<string, number[]>();
const WINDOW_MS = 10 * 60 * 1000;
const MAX_PER_WINDOW = 10;

app.post('/api/inquiries', wrap(async (req, res) => {
  const ip = req.ip ?? 'unknown';
  const now = Date.now();
  const recent = (submissions.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
  if (recent.length >= MAX_PER_WINDOW) {
    return res.status(429).json({ error: 'Too many requests. Please try again in a few minutes.' });
  }

  const b = req.body ?? {};
  const str = (v: unknown) => (typeof v === 'string' ? v.trim() : '');
  const fullName = str(b.fullName);
  const organization = str(b.organization);
  const email = str(b.email);
  const phone = str(b.phone);
  const kraPin = str(b.kraPin).toUpperCase();
  const notes = str(b.notes);
  const clientType = str(b.clientType);
  const serviceId = Number(b.serviceId);
  const pricingTierId = b.pricingTierId == null || b.pricingTierId === '' ? null : Number(b.pricingTierId);
  const stationId = b.stationId == null || b.stationId === '' ? null : Number(b.stationId);
  const quantity = Number(b.quantity ?? 1);

  const errors: Record<string, string> = {};
  if (!Number.isInteger(serviceId) || serviceId <= 0) errors.serviceId = 'Select a service.';
  if (!(CLIENT_TYPES as readonly string[]).includes(clientType)) errors.clientType = 'Select a client category.';
  if (fullName.length < 2 || fullName.length > 150) errors.fullName = 'Enter the contact person’s full name.';
  if (organization.length < 2 || organization.length > 200) errors.organization = 'Enter the organization or company name.';
  if (!EMAIL_RE.test(email) || email.length > 150) errors.email = 'Enter a valid email address.';
  if (!PHONE_RE.test(phone)) errors.phone = 'Enter a valid phone number.';
  if (kraPin && !KRA_RE.test(kraPin)) errors.kraPin = 'KRA PIN format: letter, 9 digits, letter (e.g. P051234567Z).';
  if (!Number.isInteger(quantity) || quantity < 1 || quantity > 100000) errors.quantity = 'Quantity must be between 1 and 100,000.';
  if (notes.length > 2000) errors.notes = 'Keep scope details under 2,000 characters.';
  if (pricingTierId !== null && (!Number.isInteger(pricingTierId) || pricingTierId <= 0)) errors.pricingTierId = 'Invalid tariff option.';
  if (stationId !== null && (!Number.isInteger(stationId) || stationId <= 0)) errors.stationId = 'Invalid research centre.';

  // Referential checks against the catalogue
  if (!errors.serviceId) {
    const [svc] = await pool.query<RowDataPacket[]>('SELECT id FROM services WHERE id = ?', [serviceId]);
    if (!svc.length) errors.serviceId = 'Unknown service.';
  }
  if (!errors.serviceId && pricingTierId !== null && !errors.pricingTierId) {
    const [tier] = await pool.query<RowDataPacket[]>(
      'SELECT id FROM pricing_tiers WHERE id = ? AND service_id = ? AND is_active = 1',
      [pricingTierId, serviceId]
    );
    if (!tier.length) errors.pricingTierId = 'This tariff option does not belong to the selected service.';
  }
  if (stationId !== null && !errors.stationId) {
    const [st] = await pool.query<RowDataPacket[]>('SELECT id FROM research_stations WHERE id = ?', [stationId]);
    if (!st.length) errors.stationId = 'Unknown research centre.';
  }
  if (Object.keys(errors).length) return res.status(422).json({ error: 'Please correct the highlighted fields.', fields: errors });

  // The procedure draws a random 4-digit suffix; retry on the (rare) duplicate reference.
  const conn = await pool.getConnection();
  try {
    for (let attempt = 0; attempt < 5; attempt++) {
      try {
        await conn.query('CALL sp_register_service_inquiry(?,?,?,?,?,?,?,?,?,?,?,?,@ref)', [
          serviceId, pricingTierId, stationId, clientType, fullName, organization,
          kraPin || null, email, phone, quantity, notes || null, ip.slice(0, 45),
        ]);
        const [[out]] = (await conn.query(
          `SELECT si.reference_number, si.estimated_cost_kes, si.status, si.created_at
             FROM service_inquiries si WHERE si.reference_number = @ref`
        )) as any;
        recent.push(now);
        submissions.set(ip, recent);
        return res.status(201).json({
          reference: out.reference_number,
          estimatedCostKes: Number(out.estimated_cost_kes),
          status: out.status,
          createdAt: out.created_at,
        });
      } catch (err: any) {
        if (err?.code === 'ER_DUP_ENTRY' && attempt < 4) continue;
        throw err;
      }
    }
  } finally {
    conn.release();
  }
}));

app.use('/api', (_req, res) => res.status(404).json({ error: 'Not found' }));

/* ------------------------ Built site (production) ---------------------- */
const dist = path.resolve(import.meta.dirname, '..', 'dist');
if (fs.existsSync(path.join(dist, 'index.html'))) {
  app.use(express.static(dist, { index: false, maxAge: '1h' }));
  app.get('*', (_req, res) => res.sendFile(path.join(dist, 'index.html')));
}

/* ------------------------------- Errors -------------------------------- */
app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
  console.error('[api]', err?.code ?? '', err?.message ?? err);
  const dbDown = ['ECONNREFUSED', 'PROTOCOL_CONNECTION_LOST', 'ER_ACCESS_DENIED_ERROR', 'ER_BAD_DB_ERROR'].includes(err?.code);
  res.status(dbDown ? 503 : 500).json({
    error: dbDown ? 'The services database is currently unavailable.' : 'Unexpected server error.',
  });
});

app.listen(config.apiPort, () => {
  console.log(`KMFRI Services Hub API listening on http://localhost:${config.apiPort} (db ${config.database}@${config.host})`);
});
