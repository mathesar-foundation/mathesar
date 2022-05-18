<script lang="ts">
  import {
    faExclamationTriangle,
    faPlus,
  } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Spinner } from '@mathesar-component-library';
  import { tables } from '@mathesar/stores/tables';
  import type { Column } from '@mathesar/api/tables/columns';
  import type { Constraint } from '@mathesar/api/tables/constraints';
  import type { PaginatedResponse } from '@mathesar/utils/api';
  import { getAPI } from '@mathesar/utils/api';
  import Identifier from './Identifier.svelte';

  export let constraint: Constraint;

  $: referentTable =
    constraint.type === 'foreignkey'
      ? $tables.data.get(constraint.referent_table)
      : undefined;

  async function getReferentColumns(_constraint: Constraint) {
    if (_constraint.type !== 'foreignkey') {
      return [];
    }
    const tableId = _constraint.referent_table;
    const url = `/api/db/v0/tables/${tableId}/columns/?limit=500`;
    const referentTableColumns = await getAPI<PaginatedResponse<Column>>(url);
    return referentTableColumns.results.filter((c) =>
      _constraint.referent_columns.includes(c.id),
    );
  }
</script>

<span class="fk-referent">
  <Identifier>{referentTable?.name}</Identifier>
  <span class="table-column-delimiter">.</span>
  {#await getReferentColumns(constraint)}
    <Spinner />
  {:then referentColumns}
    {#each referentColumns as referentColumn, index (referentColumn.id)}
      <Identifier>{referentColumn.name}</Identifier>
      {#if index < referentColumns.length - 1}
        <Icon data={faPlus} />
      {/if}
    {/each}
  {:catch error}
    <Icon data={faExclamationTriangle} />
  {/await}
</span>
