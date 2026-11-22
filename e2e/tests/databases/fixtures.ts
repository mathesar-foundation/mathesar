import { uniqueName, uniqueRoleName } from '../../support/api/mathesar';
import { quoteIdentifier, runSql } from '../../support/api/postgres';
import { env } from '../../support/env';
import { test as base } from '../../support/fixtures';

/** A database on the server of the stack that Mathesar does not know, with the login role that owns it. */
export interface ExternalDatabase {
  name: string;
  role: string;
  password: string;
}

interface DatabasesFixtures {
  /**
   * Reserves the name of a database. After the test the database is
   * disconnected and dropped, if the test or the UI created it.
   */
  newDatabaseName: (prefix?: string) => string;
  externalDatabase: ExternalDatabase;
  /**
   * Another spelling of the stack's host, a server of its own for `externalDatabase`.
   * The server is deleted after the test, so the test must be `runsAlone`.
   */
  otherHostSpelling: string;
}

/** The stack's server as Mathesar shows it on a card. */
export const SERVER = `${env.postgresFromMathesar.host}:${env.postgresFromMathesar.port}`;

/** A function of Mathesar that no page of these tests needs. A test drops it to see a reinstall put it back. */
export const SAMPLE_FUNCTION = 'msar.get_object_counts()';

/** The owner of `SAMPLE_FUNCTION`, or no row when the function is missing. */
export function sampleFunctionOwners(
  database: string,
): Promise<{ owner: string }[]> {
  return runSql(
    database,
    `SELECT proowner::regrole::text AS owner FROM pg_proc
     WHERE oid = to_regprocedure('${SAMPLE_FUNCTION}')`,
  );
}

/** Whether the database has the schemas that Mathesar installs. */
export async function installedSchemas(database: string): Promise<string[]> {
  const schemas = await runSql<{ nspname: string }>(
    database,
    `SELECT nspname FROM pg_namespace
     WHERE nspname IN ('msar', '__msar', 'mathesar_types')
     ORDER BY nspname`,
  );
  return schemas.map(({ nspname }) => nspname);
}

export const test = base.extend<DatabasesFixtures>({
  newDatabaseName: async ({ api }, use) => {
    const names: string[] = [];
    await use((prefix = 'e2e_db') => {
      const name = uniqueName(prefix);
      names.push(name);
      return name;
    });
    for (const name of names) await api.dropDatabaseNamed(name);
  },

  externalDatabase: async ({ api }, use) => {
    const name = uniqueName('e2e_db');
    const role = uniqueRoleName();
    const password = 'e2e-owner-password';
    await runSql(
      'postgres',
      `CREATE ROLE ${quoteIdentifier(role)} LOGIN PASSWORD '${password}'`,
    );
    await runSql(
      'postgres',
      `CREATE DATABASE ${quoteIdentifier(name)} OWNER ${quoteIdentifier(role)}`,
    );
    await use({ name, role, password });
    await api.dropDatabaseNamed(name);
  },

  otherHostSpelling: async ({ api, externalDatabase }, use) => {
    const host = env.postgresFromMathesar.host.toUpperCase();
    await use(host);
    // Mathesar deletes a server only together with its last database.
    const database =
      (await api.findDatabase(externalDatabase.name)) ??
      (await api.connectDatabase({ ...externalDatabase, host }));
    await api.disconnectDatabaseAndServer(database);
  },
});

export { expect } from '../../support/fixtures';
