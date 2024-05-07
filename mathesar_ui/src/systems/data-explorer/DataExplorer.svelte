<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { queries } from '@mathesar/stores/queries';
  import { Tutorial } from '@mathesar-component-library';

  import ActionsPane from './ActionsPane.svelte';
  import { WithExplorationInspector } from './exploration-inspector';
  import WithInputSidebar from './input-sidebar/WithInputSidebar.svelte';
  import type QueryManager from './QueryManager';
  import ResultPane from './result-pane/ResultPane.svelte';
  import type { ColumnWithLink } from './utils';

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};
  export let canEditMetadata: boolean;

  $: ({ query } = queryManager);
  $: hasNoColumns = $query.initial_columns.length === 0;

  let isInspectorOpen = true;
</script>

<div class="data-explorer">
  <ActionsPane
    {queryManager}
    {canEditMetadata}
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
        {#if hasNoColumns}
          <div class="help-text">
            {$_('get_started_by_adding_columns_from_left')}
          </div>
        {:else}
          <WithExplorationInspector
            {isInspectorOpen}
            queryHandler={queryManager}
            {canEditMetadata}
            on:delete
          >
            <ResultPane queryHandler={queryManager} />
          </WithExplorationInspector>
        {/if}
      </WithInputSidebar>
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
      .help-text {
        margin-top: 10rem;
      }
    }
  }
</style>
