<script lang="ts">
  import { Tutorial } from '@mathesar-component-library';
  import { queries } from '@mathesar/stores/queries';
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
  <ActionsPane
    {queryManager}
    bind:linkCollapsibleOpenState
    bind:isInspectorOpen
    on:close
  />
  {#if !$query.base_table}
    <div class="initial-content">
      {#if $queries.requestStatus.state === 'success' && $queries.data.size === 0}
        <div class="tutorial-holder">
          <Tutorial>
            <span slot="title">
              Create and Share Explorations of Your Data
            </span>
            <span slot="body">
              Use Data Explorer to analyze and share your data. Explorations are
              based on tables in your schema, to get started choose a table and
              start adding columns and transformations.
            </span>
          </Tutorial>
        </div>
      {/if}
      <div class="help-text">
        Get started by selecting a table and adding columns
      </div>
    </div>
  {:else}
    <div class="content-pane">
      <InputSidebar {queryManager} {linkCollapsibleOpenState} />
      {#if hasNoColumns}
        <div class="help-text">Get started by adding columns from the left</div>
      {:else}
        <ResultPane queryHandler={queryManager} />
        {#if isInspectorOpen}
          <ExplorationInspector queryHandler={queryManager} on:delete />
        {/if}
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .data-explorer {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;

    .help-text {
      display: inline-block;
      margin-left: auto;
      margin-right: auto;
      font-size: var(--text-size-x-large);
      color: var(--slate-500);
    }

    .initial-content {
      display: flex;
      overflow: auto;
      flex-direction: column;
      align-items: center;

      .tutorial-holder {
        margin-top: 4rem;
        max-width: 70%;
      }

      .help-text {
        margin: 10rem 0;
      }
      .tutorial-holder + .help-text {
        margin: 5rem 0;
      }
    }

    .content-pane {
      display: flex;
      overflow: hidden;
      overflow-x: auto;
      --input-pane-width: 25.8rem;
      --exploration-inspector-width: 22.9rem;

      .help-text {
        margin-top: 10rem;
      }
    }
  }
</style>
