import pg from 'pg';

const pool = new pg.Pool({
  host: process.env.POSTGRES_HOST || 'mathesar-e2e-db',
  port: parseInt(process.env.POSTGRES_PORT || '5432', 10),
  database: process.env.POSTGRES_DB || 'mathesar_django',
  user: process.env.POSTGRES_USER || 'mathesar',
  password: process.env.POSTGRES_PASSWORD || 'mathesar',
});

export { pool as db };
