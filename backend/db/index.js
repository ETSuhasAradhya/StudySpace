import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const connectionString = process.env.DATABASE_URL || 'postgresql://neondb_owner:npg_gbpE8YK9yURL@ep-wispy-king-ayfkd1d7-pooler.c-5.us-east-2.aws.neon.tech/neondb?sslmode=require';

const sql = neon(connectionString);

/**
 * Universal Query Executor for StudySpace:
 * Uses Neon Serverless HTTP API (Port 443) which effortlessly traverses 
 * firewalls, university Wi-Fi blocks on TCP 5432, and Docker virtualized networks.
 */
export const query = async (text, params = []) => {
  try {
    const rows = await sql.query(text, params);
    return {
      rows: Array.isArray(rows) ? rows : [],
      rowCount: Array.isArray(rows) ? rows.length : 0
    };
  } catch (error) {
    console.error('Database query error:', error.message);
    throw error;
  }
};

export const pool = {
  query,
  connect: async () => ({
    query,
    release: () => {}
  }),
  end: async () => {}
};

export default { pool, query };
