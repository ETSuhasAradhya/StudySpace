import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import { pool } from './index.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

async function initDatabase() {
  console.log('🔄 Connecting to PostgreSQL database...');
  try {
    const client = await pool.connect();
    console.log('✅ Connected to database successfully.');

    const schemaPath = path.join(__dirname, 'schema.sql');
    const sql = fs.readFileSync(schemaPath, 'utf8');

    console.log('⏳ Running schema migration & seeding sample data...');
    await client.query(sql);
    console.log('🎉 Database tables created and sample data seeded successfully!');

    // Print summary
    const usersCount = await client.query('SELECT count(*) FROM users');
    const spacesCount = await client.query('SELECT count(*) FROM study_spaces');
    const seatsCount = await client.query('SELECT count(*) FROM seats');
    const reservationsCount = await client.query('SELECT count(*) FROM reservations');

    console.log('\n📊 Database Summary:');
    console.log(` - Users: ${usersCount.rows[0].count}`);
    console.log(` - Study Spaces: ${spacesCount.rows[0].count}`);
    console.log(` - Seats: ${seatsCount.rows[0].count}`);
    console.log(` - Reservations: ${reservationsCount.rows[0].count}`);

    client.release();
    await pool.end();
    process.exit(0);
  } catch (error) {
    console.error('❌ Failed to initialize database:', error.message);
    console.error('👉 Please check your DATABASE_URL in backend/.env');
    await pool.end();
    process.exit(1);
  }
}

initDatabase();
