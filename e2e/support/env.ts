function fromEnv(name: string, fallback: string): string {
  return process.env[name] ?? fallback;
}

export const env = {
  baseUrl: fromEnv('MATHESAR_URL', 'http://localhost'),
  admin: {
    username: fromEnv('MATHESAR_USER', 'admin'),
    password: fromEnv('MATHESAR_PASSWORD', 'mathesar-e2e-admin'),
  },
  /** The PostgreSQL server of the stack, as the test runner reaches it. */
  postgres: {
    host: fromEnv('E2E_POSTGRES_HOST', 'localhost'),
    port: Number(fromEnv('E2E_POSTGRES_PORT', '5433')),
    user: fromEnv('E2E_POSTGRES_USER', 'mathesar'),
    password: fromEnv('E2E_POSTGRES_PASSWORD', 'mathesar'),
  },
  /** The same server, as the Mathesar service reaches it. */
  postgresFromMathesar: {
    host: fromEnv('E2E_POSTGRES_HOST_FROM_MATHESAR', 'mathesar_db'),
    port: Number(fromEnv('E2E_POSTGRES_PORT_FROM_MATHESAR', '5432')),
  },
};
