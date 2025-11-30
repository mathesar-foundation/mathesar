import { type Readable, derived, writable } from 'svelte/store';

import { api } from '@mathesar/api/rpc';

export interface DeprecationWarning {
  database_id: number;
  database_name: string;
  database_nickname: string | null;
  postgres_version: string;
  postgres_major_version: number;
  warning_message: string;
  warning_type: string;
}

async function fetchDeprecationWarnings(): Promise<DeprecationWarning[]> {
  try {
    // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
    const warnings =
      (await api.databases.get_all_deprecation_warnings()) as DeprecationWarning[];
    return warnings || [];
  } catch (error) {
    console.error('Failed to fetch deprecation warnings:', error);
    return [];
  }
}

function createDeprecationWarningsStore() {
  const { subscribe, set } = writable<DeprecationWarning[]>([]);

  async function refresh() {
    const warnings = await fetchDeprecationWarnings();
    set(warnings);
  }

  return {
    subscribe,
    refresh,
  };
}

export const deprecationWarnings = createDeprecationWarningsStore();

/**
 * Derived store that filters warnings by type
 */
export const postgresDeprecationWarnings: Readable<DeprecationWarning[]> =
  derived(deprecationWarnings, ($warnings) =>
    $warnings.filter((w) => w.warning_type === 'postgres_version'),
  );

/**
 * Derived store that indicates if there are any active warnings
 */
export const hasDeprecationWarnings: Readable<boolean> = derived(
  deprecationWarnings,
  ($warnings) => $warnings.length > 0,
);
