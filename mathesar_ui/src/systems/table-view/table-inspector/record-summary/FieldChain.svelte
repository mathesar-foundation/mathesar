<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { defined } from '@mathesar/component-library';
  import FieldDelimiter from '@mathesar/components/FieldDelimiter.svelte';
  import SelectProcessedColumn from '@mathesar/components/SelectProcessedColumn.svelte';
  import type { Schema } from '@mathesar/models/Schema';
  import {
    type ProcessedColumns,
    TableStructure,
  } from '@mathesar/stores/table-data';

  import FieldChainTail from './FieldChainTail.svelte';

  export let schema: Schema;
  export let columnIds: string[];
  export let columns: ProcessedColumns;
  export let onUpdate: (columnIds: string[]) => void;

  $: column = defined(columnIds[0], (c) => columns.get(c));
  /**
   * Note: This currently assumes both the base table & referent table
   * belong to the same schema.
   *
   * We need to fetch the schema of the referent tables when fetching its
   * TableStructure.
   *
   * This assumption is already baked into several parts of the codebase, so
   * schema is passed here as a prop until we refactor the core assumption out.
   */
  $: referentTable = defined(
    column?.linkFk?.referent_table_oid,
    (oid) => new TableStructure({ schema, oid }),
  );
</script>

{#if columnIds[0] !== undefined && column === undefined}
  <div class="deleted-column">{$_('deleted_column')}</div>
{:else}
  <div class="column-select">
    <SelectProcessedColumn
      columns={[...columns.values()]}
      value={column}
      onUpdate={(c) => onUpdate(c ? [c.id] : [])}
      allowEmpty
    />
    {#if referentTable}
      <div class="delimiter">
        <FieldDelimiter />
      </div>
    {/if}
  </div>
{/if}

{#if referentTable}
  <FieldChainTail
    {schema}
    columnIds={columnIds.slice(1)}
    {referentTable}
    onUpdate={(ids) =>
      onUpdate([...(defined(column, (c) => [c.id]) ?? []), ...ids])}
  />
{/if}

<style>
  .column-select {
    display: flex;
    align-items: center;
    /* We need some margin here in order to vertically multiple column select
    elements when there are so many that they wrap within the same template
    part. */
    margin: var(--column-select-margin) 0;
  }
  .deleted-column {
    margin-top: 0.8rem;
    color: var(--color-fg-base-disabled);
    font-size: var(--sm1);
    font-style: italic;
  }
  .delimiter {
    margin: 0 0.1rem;
  }
</style>
