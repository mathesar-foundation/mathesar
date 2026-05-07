import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST!,
  port: parseInt(process.env.POSTGRES_PORT!),
  database: process.env.POSTGRES_DB!,
  user: process.env.POSTGRES_USER!,
  password: process.env.POSTGRES_PASSWORD!,
});

export { pool as db };
