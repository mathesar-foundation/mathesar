<script lang="ts">
  import { TabContainer, Spinner } from '@mathesar-component-library';
  import { getAvailableName } from '@mathesar/utils/db';
  import ColumnSelectionPane from './column-selection-pane/ColumnSelectionPane.svelte';
  import TransformationsPane from './transformations-pane/TransformationsPane.svelte';
  import type QueryManager from '../QueryManager';
  import type { ColumnWithLink } from '../utils';

  export let queryManager: QueryManager;

  $: ({ query, state } = queryManager);
  $: ({ inputColumnsFetchState } = $state);

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

<aside class="input-sidebar">
  <div>Build your Exploration</div>
  <div>
    <TabContainer
      tabs={[
        { id: 'column-selection', label: 'Select Columns' },
        { id: 'transform-results', label: 'Transform Results' },
      ]}
      fillWidth
      let:activeTab
    >
      {#if inputColumnsFetchState?.state === 'processing'}
        <Spinner />
      {:else if inputColumnsFetchState?.state === 'success'}
        {#if activeTab.id === 'column-selection'}
          <ColumnSelectionPane
            {queryManager}
            on:add={(e) => addColumn(e.detail)}
          />
        {:else}
          <TransformationsPane {queryManager} />
        {/if}
      {:else if inputColumnsFetchState?.state === 'failure'}
        Failed to fetch column information
      {/if}
    </TabContainer>
  </div>
</aside>

<style lang="scss">
  aside.input-sidebar {
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
