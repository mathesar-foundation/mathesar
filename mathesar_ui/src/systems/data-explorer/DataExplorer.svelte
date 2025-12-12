<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { queries } from '@mathesar/stores/queries';
  import { Tutorial } from '@mathesar-component-library';

  import ActionsPane from './action-pane/ActionsPane.svelte';
  import { WithExplorationInspector } from './exploration-inspector';
  import WithInputSidebar from './input-sidebar/WithInputSidebar.svelte';
  import type QueryManager from './QueryManager';
  import ExplorationResults from './result-pane/ExplorationResults.svelte';
  import StatusBar from './StatusBar.svelte';
  import type { ColumnWithLink } from './utils';

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};

  $: ({ query } = queryManager);
  $: hasColumns = !!$query.initial_columns.length;

  let isInspectorOpen = true;
</script>

<div class="data-explorer" class:inspector-open={isInspectorOpen}>
  <ActionsPane
    {queryManager}
    bind:linkCollapsibleOpenState
    bind:isInspectorOpen
  />
  {#if !$query.base_table_oid}
    <div class="initial-content">
      {#if $queries.requestStatus.state === 'success' && $queries.data.size === 0}
        <div class="tutorial-holder">
          <Tutorial>
            <span slot="title">
              {$_('create_share_explorations_of_your_data')}
            </span>
            <span slot="body">
              {$_('create_exploration_empty_state_help')}
            </span>
          </Tutorial>
        </div>
      {/if}
      <div class="help-text">
        {$_('get_started_by_adding_table_and_columns')}
      </div>
    </div>
  {:else}
    <div class="content-pane">
      <WithInputSidebar {queryManager} {linkCollapsibleOpenState}>
        {#if !hasColumns}
          <div class="help-text">
            {$_('get_started_by_adding_columns_from_left')}
          </div>
        {:else}
          <div class="results-wrapper">
            <WithExplorationInspector
              {isInspectorOpen}
              queryHandler={queryManager}
              on:delete
            >
              <ExplorationResults queryHandler={queryManager} />
            </WithExplorationInspector>
          </div>
        {/if}
      </WithInputSidebar>
      {#if hasColumns}
        <StatusBar queryHandler={queryManager} />
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
      padding: 0 1rem;
      text-align: center;
      font-size: var(--lg2);
      color: var(--color-fg-base-muted);
    }

    .initial-content {
      display: flex;
      overflow: auto;
      flex-direction: column;
      align-items: center;

      .tutorial-holder {
        margin-top: 4rem;
        max-width: 40%;
      }

      .help-text {
        margin: 10rem 0;
      }
      .tutorial-holder + .help-text {
        margin: 5rem 0;
      }
    }

    .content-pane {
      display: grid;
      grid-template: 1fr auto / 1fr;
      overflow: hidden;
      padding: 0 var(--sm3);
      .results-wrapper {
        height: 100%;
      }
    }
  }
</style>
