import pg from 'pg';
import dotenv from 'dotenv';

dotenv.config();

const { Pool } = pg;

const connectionString = process.env.DATABASE_URL;

const isProduction = process.env.NODE_ENV === 'production' || 
                     (connectionString && (connectionString.includes('neon.tech') || connectionString.includes('render.com')));

export const pool = new Pool({
  connectionString,
  ssl: isProduction ? { rejectUnauthorized: false } : false
});

// Helper for executing queries
export const query = (text, params) => pool.query(text, params);
