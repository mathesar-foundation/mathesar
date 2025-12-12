import { get } from 'svelte/store';
import { _ } from 'svelte-i18n';

import type { Table } from '@mathesar/models/Table';

export function getDefaultFormName(baseTable: Table) {
  return get(_)('form_for_table', {
    values: {
      tableName: baseTable.name,
    },
  });
}
