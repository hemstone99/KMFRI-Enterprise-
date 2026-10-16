import path from 'node:path';
import dotenv from 'dotenv';
import mysql from 'mysql2/promise';

// .env.local (machine-specific credentials) takes precedence over .env
const root = path.resolve(import.meta.dirname, '..');
dotenv.config({ path: path.join(root, '.env.local'), quiet: true });
dotenv.config({ path: path.join(root, '.env'), quiet: true });

export const config = {
  host: process.env.DB_HOST ?? '127.0.0.1',
  port: Number(process.env.DB_PORT ?? 3306),
  user: process.env.DB_USER ?? 'kmfri_hub',
  password: process.env.DB_PASSWORD ?? '',
  database: process.env.DB_NAME ?? 'kmfri_services_db',
  apiPort: Number(process.env.API_PORT ?? 4000),
};

export const pool = mysql.createPool({
  host: config.host,
  port: config.port,
  user: config.user,
  password: config.password,
  database: config.database,
  charset: 'utf8mb4',
  timezone: '+03:00',
  // DECIMAL columns come back as strings by default; tariffs are well within double precision.
  decimalNumbers: true,
  connectionLimit: 10,
  waitForConnections: true,
});
