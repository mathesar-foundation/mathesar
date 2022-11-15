<script lang="ts">
  import { iconExploration } from '@mathesar/icons';
  import EntityPageHeader from '@mathesar/components/EntityPageHeader.svelte';
  import type QueryManager from './QueryManager';
  import InputSidebar from './input-sidebar/InputSidebar.svelte';
  import ResultPane from './result-pane/ResultPane.svelte';
  import ExplorationInspector from './exploration-inspector/ExplorationInspector.svelte';
  import type { ColumnWithLink } from './utils';
  import ActionsPane from './ActionsPane.svelte';

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};

  $: ({ query } = queryManager);
  $: hasNoColumns = $query.initial_columns.length === 0;

  let isInspectorOpen = true;
</script>

<div class="data-explorer">
  {#if $query.isSaved()}
    <EntityPageHeader
      icon={iconExploration}
      name={$query.name ?? ''}
      description={$query.description}
    >
      <ActionsPane
        {queryManager}
        bind:linkCollapsibleOpenState
        bind:isInspectorOpen
      />
    </EntityPageHeader>
  {:else}
    <div class="header">
      <ActionsPane
        {queryManager}
        bind:linkCollapsibleOpenState
        bind:isInspectorOpen
      />
    </div>
  {/if}
  <div class="content-pane">
    {#if !$query.base_table}
      <div class="help-text">
        Get started by selecting a table and adding columns
      </div>
    {:else}
      <InputSidebar {queryManager} {linkCollapsibleOpenState} />
      {#if hasNoColumns}
        <div class="help-text">Get started by adding columns from the left</div>
      {:else}
        <ResultPane queryRunner={queryManager} />
        {#if isInspectorOpen}
          <ExplorationInspector queryHandler={queryManager} on:delete />
        {/if}
      {/if}
    {/if}
  </div>
</div>

<style lang="scss">
  .data-explorer {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;

    .header {
      border-bottom: 1px solid var(--slate-300);
      position: relative;
      padding: 0 var(--size-large);
    }

    .content-pane {
      display: flex;
      overflow: hidden;
      overflow-x: auto;
      --input-pane-width: 25.8rem;
      --exploration-inspector-width: 22.9rem;

      .help-text {
        display: inline-block;
        margin-top: 10rem;
        margin-left: auto;
        margin-right: auto;
        font-size: var(--text-size-xx-large);
        color: var(--slate-400);
      }
    }
  }
</style>
