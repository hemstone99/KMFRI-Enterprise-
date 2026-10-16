/**
 * Creates/rebuilds kmfri_services_db from db/*.sql and provisions the
 * application account the API connects with.
 *
 *   npm run db:setup
 *
 * Uses DB_ADMIN_USER / DB_ADMIN_PASSWORD (a MySQL account allowed to create
 * databases, routines and users) and grants DB_USER only what the site needs:
 * read access, plus EXECUTE on the inquiry procedure (which runs with its
 * definer's rights to insert the inquiry and its audit-history row).
 *
 * WARNING: 001_kmfri_services_db.sql drops and recreates every table, so
 * re-running this resets all inquiries to the seed data.
 */
import fs from 'node:fs';
import path from 'node:path';
import mysql from 'mysql2/promise';
import { config } from './db';

/** Split a MySQL script into statements, honouring DELIMITER, quotes and comments. */
export function splitSql(script: string): string[] {
  const out: string[] = [];
  let delimiter = ';';
  let buf = '';
  let i = 0;
  const n = script.length;

  while (i < n) {
    // DELIMITER directive (client-side command, only at line start)
    const lineStart = i === 0 || script[i - 1] === '\n';
    if (lineStart) {
      const m = /^[ \t]*DELIMITER[ \t]+(\S+)[ \t]*\r?(\n|$)/i.exec(script.slice(i));
      if (m) {
        delimiter = m[1];
        i += m[0].length;
        continue;
      }
    }
    const ch = script[i];
    const next = script[i + 1];

    // Comments
    if (ch === '-' && next === '-' && /\s/.test(script[i + 2] ?? ' ')) {
      const end = script.indexOf('\n', i);
      i = end === -1 ? n : end + 1;
      buf += '\n';
      continue;
    }
    if (ch === '#') {
      const end = script.indexOf('\n', i);
      i = end === -1 ? n : end + 1;
      buf += '\n';
      continue;
    }
    if (ch === '/' && next === '*') {
      const end = script.indexOf('*/', i + 2);
      i = end === -1 ? n : end + 2;
      buf += ' ';
      continue;
    }

    // Quoted strings / identifiers
    if (ch === "'" || ch === '"' || ch === '`') {
      let j = i + 1;
      while (j < n) {
        if (script[j] === '\\' && ch !== '`') { j += 2; continue; }
        if (script[j] === ch) {
          if (script[j + 1] === ch) { j += 2; continue; } // doubled quote escape
          break;
        }
        j++;
      }
      buf += script.slice(i, j + 1);
      i = j + 1;
      continue;
    }

    // Statement terminator
    if (script.startsWith(delimiter, i)) {
      if (buf.trim()) out.push(buf.trim());
      buf = '';
      i += delimiter.length;
      continue;
    }

    buf += ch;
    i++;
  }
  if (buf.trim()) out.push(buf.trim());
  return out;
}

async function main() {
  const adminUser = process.env.DB_ADMIN_USER ?? 'root';
  const adminPassword = process.env.DB_ADMIN_PASSWORD ?? '';
  const admin = await mysql.createConnection({
    host: config.host,
    port: config.port,
    user: adminUser,
    password: adminPassword,
    charset: 'utf8mb4',
  });
  const [[ver]] = (await admin.query('SELECT VERSION() AS v')) as any;
  console.log(`Connected to ${config.host}:${config.port} as ${adminUser} (server ${ver.v})`);

  const dir = path.resolve(import.meta.dirname, '..', 'db');
  const files = fs.readdirSync(dir).filter((f) => /^\d+_.*\.sql$/.test(f)).sort();
  for (const file of files) {
    const statements = splitSql(fs.readFileSync(path.join(dir, file), 'utf8'));
    for (const [idx, sql] of statements.entries()) {
      try {
        await admin.query(sql);
      } catch (err: any) {
        console.error(`\n${file} statement #${idx + 1} failed:\n${sql.slice(0, 400)}\n`);
        throw err;
      }
    }
    console.log(`  ✓ ${file} (${statements.length} statements)`);
  }

  // Least-privilege application account
  if (!config.password) throw new Error('Set DB_PASSWORD (application account password) in .env.local');
  const db = config.database;
  const appHosts = ['localhost', '127.0.0.1'];
  for (const host of appHosts) {
    const acct = `${mysql.escape(config.user)}@${mysql.escape(host)}`;
    await admin.query(`CREATE USER IF NOT EXISTS ${acct} IDENTIFIED BY ${mysql.escape(config.password)}`);
    await admin.query(`ALTER USER ${acct} IDENTIFIED BY ${mysql.escape(config.password)}`);
    await admin.query(`GRANT SELECT ON \`${db}\`.* TO ${acct}`);
    await admin.query(`GRANT EXECUTE ON PROCEDURE \`${db}\`.sp_register_service_inquiry TO ${acct}`);
    await admin.query(`GRANT EXECUTE ON PROCEDURE \`${db}\`.sp_get_service_full_details TO ${acct}`);
  }
  await admin.query('FLUSH PRIVILEGES');
  console.log(`  ✓ application account ${config.user} (SELECT + EXECUTE on ${db})`);

  const [counts] = (await admin.query(
    `SELECT (SELECT COUNT(*) FROM \`${db}\`.services) AS services,
            (SELECT COUNT(*) FROM \`${db}\`.pricing_tiers) AS tiers,
            (SELECT COUNT(*) FROM \`${db}\`.research_stations) AS stations,
            (SELECT COUNT(*) FROM \`${db}\`.service_inquiries) AS inquiries`
  )) as any;
  console.log('  ✓ seeded:', counts[0]);
  await admin.end();
}

if (process.argv[1] && path.resolve(process.argv[1]) === path.resolve(import.meta.filename)) {
  main().catch((err) => {
    console.error(err.message ?? err);
    process.exit(1);
  });
}
