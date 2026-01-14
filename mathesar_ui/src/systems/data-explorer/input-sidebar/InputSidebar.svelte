<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { getAvailableName } from '@mathesar/utils/db';
  import { modal } from '@mathesar/stores/modal';
  import { Spinner, TabContainer } from '@mathesar-component-library';

  import SummarizeColumnModal from './SummarizeColumnModal.svelte';

  import type QueryManager from '../QueryManager';
  import type { ColumnWithLink } from '../utils';

  import ColumnSelectionPane from './column-selection-pane/ColumnSelectionPane.svelte';
  import TransformationsPane from './transformations-pane/TransformationsPane.svelte';

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};

  $: ({ query, state, confirmationNeededForMultipleResults } = queryManager);
  $: ({ inputColumnsFetchState } = $state);

  const tabs = [
    { id: 'column-selection', label: $_('select_columns') },
    { id: 'transform-results', label: $_('transform_results') },
  ];
  let activeTab = tabs[0];

  const summarizeModal = modal.spawnModalController();
  let pendingColumn: ColumnWithLink | null = null;
  let pendingAlias = '';

  async function addColumn(column: ColumnWithLink) {
    const baseAlias = `${column.tableName}_${column.name}`;
    const allAliases = new Set($query.initial_columns.map((c) => c.alias));
    const alias = getAvailableName(baseAlias, allAliases);
    const queryHasNoSummarization = !$query.hasSummarizationTransform();

    if (
      column.producesMultipleResults &&
      $confirmationNeededForMultipleResults &&
      queryHasNoSummarization
    ) {
      // Show modal and store pending column info
      pendingColumn = column;
      pendingAlias = alias;
      summarizeModal.open();
      return;
    }

    // Add column without summarization
    await performColumnAddition(column, alias, false);
  }

  async function performColumnAddition(
    column: ColumnWithLink,
    alias: string,
    addNewAutoSummarization: boolean,
  ) {
    const queryHasNoSummarization = !$query.hasSummarizationTransform();

    await queryManager.update((q) => {
      const newQuery = q.withInitialColumn({
        alias,
        attnum: column.id,
        join_path: column.jpPath,
      });
      if (addNewAutoSummarization) {
        const autoSummarization =
          queryManager.getAutoSummarizationTransformModel();
        if (autoSummarization) {
          return newQuery.model.addSummarizationTransform(autoSummarization);
        }
      }
      return newQuery;
    });
    if (queryHasNoSummarization) {
      queryManager.selectColumn(alias);
    }
    // Select transformations tab if auto summarization is added
    if (addNewAutoSummarization) {
      [, activeTab] = tabs;
    }
  }

  async function handleSummarize() {
    if (pendingColumn && pendingAlias) {
      await performColumnAddition(pendingColumn, pendingAlias, true);
    }
    summarizeModal.close();
    pendingColumn = null;
    pendingAlias = '';
  }

  async function handleWithoutSummarization() {
    if (pendingColumn && pendingAlias) {
      await performColumnAddition(pendingColumn, pendingAlias, false);
    }
    summarizeModal.close();
    pendingColumn = null;
    pendingAlias = '';
  }

  function handleModalClose() {
    // Just close modal without adding column
    pendingColumn = null;
    pendingAlias = '';
  }
</script>

<aside class="input-sidebar">
  <section class="input-pane">
    <TabContainer
      {tabs}
      tabStyle="compact"
      fillTabWidth
      fillContainerHeight
      bind:activeTab
    >
      {#if inputColumnsFetchState?.state === 'processing'}
        <div class="loading-state">
          <Spinner />
        </div>
      {:else if inputColumnsFetchState?.state === 'success'}
        {#if activeTab?.id === 'column-selection'}
          <div class="help-text">
            {$_('select_columns_for_exploration_help')}
          </div>
          <ColumnSelectionPane
            {queryManager}
            {linkCollapsibleOpenState}
            on:add={(e) => addColumn(e.detail)}
          />
        {:else if activeTab?.id === 'transform-results'}
          <div class="help-text">
            {$_('transform_results_help')}
          </div>
          <TransformationsPane {queryManager} />
        {/if}
      {:else if inputColumnsFetchState?.state === 'failure'}
        <ErrorBox>
          {$_('failed_to_fetch_column_information')}
          {inputColumnsFetchState?.errors.join(';')}
        </ErrorBox>
      {/if}
    </TabContainer>
  </section>
</aside>

<SummarizeColumnModal
  controller={summarizeModal}
  columnName={pendingColumn?.name ?? ''}
  onSummarize={handleSummarize}
  onWithoutSummarization={handleWithoutSummarization}
  on:close={handleModalClose}
/>

<style lang="scss">
  aside.input-sidebar {
    height: 100%;
    border: 1px solid;
    border-top-color: var(--color-border-supporting);
    border-right-color: var(--color-border-supporting);
    border-bottom-color: color-mix(
      in srgb,
      var(--color-border-supporting),
      transparent 40%
    );
    border-left-color: color-mix(
      in srgb,
      var(--color-border-supporting),
      transparent 20%
    );
    border-radius: var(--border-radius-l);
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .input-pane {
      flex-grow: 1;
      overflow: hidden;
      position: relative;
      background-color: var(--color-bg-supporting);

      .loading-state {
        padding: var(--lg1);
      }

      .help-text {
        padding: var(--lg1);
        font-size: var(--sm1);
      }
    }
  }
</style>
