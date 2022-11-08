<script lang="ts">
  import { getAvailableName } from '@mathesar/utils/db';
  import ColumnSelectionPane from './column-selection-pane/ColumnSelectionPane.svelte';
  import type QueryManager from '../QueryManager';
  import type { ColumnWithLink } from '../utils';

  export let queryManager: QueryManager;

  $: ({ query } = queryManager);

  async function addColumn(column: ColumnWithLink) {
    const baseAlias = `${column.tableName}_${column.name}`;
    const allAliases = new Set($query.initial_columns.map((c) => c.alias));
    const alias = getAvailableName(baseAlias, allAliases);
    await queryManager.update((q) =>
      q.withColumn({
        alias,
        id: column.id,
        jp_path: column.jpPath,
        display_name: alias,
      }),
    );
    queryManager.selectColumn(alias);
  }
</script>

<div class="input-sidebar">
  <ColumnSelectionPane {queryManager} on:add={(e) => addColumn(e.detail)} />
</div>

<style lang="scss">
  .input-sidebar {
    --input-pane-width: 25.8rem;
    width: var(--input-pane-width);
    flex-basis: var(--input-pane-width);
    border-right: 1px solid var(--slate-300);
    background-color: var(--sand-100);
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    flex-direction: column;
  }
</style>
