<script lang="ts">
  import { TabContainer, Spinner } from '@mathesar-component-library';
  import { getAvailableName } from '@mathesar/utils/db';
  import { confirm } from '@mathesar/stores/confirmation';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import ColumnSelectionPane from './column-selection-pane/ColumnSelectionPane.svelte';
  import TransformationsPane from './transformations-pane/TransformationsPane.svelte';
  import type QueryManager from '../QueryManager';
  import type { ColumnWithLink } from '../utils';

  export let queryManager: QueryManager;
  export let linkCollapsibleOpenState: Record<ColumnWithLink['id'], boolean> =
    {};

  $: ({ query, state, confirmationNeededForMultipleResults } = queryManager);
  $: ({ inputColumnsFetchState } = $state);

  const tabs = [
    { id: 'column-selection', label: 'Select Columns' },
    { id: 'transform-results', label: 'Transform Results' },
  ];
  let activeTab = tabs[0];

  async function addColumn(column: ColumnWithLink) {
    const baseAlias = `${column.tableName}_${column.name}`;
    const allAliases = new Set($query.initial_columns.map((c) => c.alias));
    const alias = getAvailableName(baseAlias, allAliases);
    const queryHasNoSummarization = !$query.hasSummarizationTransform();
    let addNewAutoSummarization = false;
    if (
      column.producesMultipleResults &&
      $confirmationNeededForMultipleResults &&
      queryHasNoSummarization
    ) {
      addNewAutoSummarization = await confirm({
        title: "You're adding a column with multiple related records",
        body: `By default, Mathesar shows only one related record per row.
               We recommend adding a summarization step if you'd like to see
               related records as a list instead.`,
        proceedButton: {
          label: 'Yes, show related records as a list',
          icon: undefined,
        },
        cancelButton: { label: 'Do not summarize', icon: undefined },
      });
      confirmationNeededForMultipleResults.set(false);
    }
    await queryManager.update((q) => {
      const newQuery = q.withColumn({
        alias,
        id: column.id,
        jp_path: column.jpPath,
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
    // Select transformations tab is auto summarization is added
    if (addNewAutoSummarization) {
      [, activeTab] = tabs;
    }
  }
</script>

<aside class="input-sidebar">
  <header>Build your Exploration</header>
  <section class="input-pane">
    <TabContainer {tabs} fillTabWidth fillContainerHeight bind:activeTab>
      {#if inputColumnsFetchState?.state === 'processing'}
        <div class="loading-state">
          <Spinner />
        </div>
      {:else if inputColumnsFetchState?.state === 'success'}
        {#if activeTab?.id === 'column-selection'}
          <div class="help-text">
            Select the columns that will be used for the exploration. Columns
            are limited to those from the base table and it's linked tables.
          </div>
          <ColumnSelectionPane
            {queryManager}
            {linkCollapsibleOpenState}
            on:add={(e) => addColumn(e.detail)}
          />
        {:else if activeTab?.id === 'transform-results'}
          <div class="help-text">
            Transformations can be used to summarize data, filter data, and
            more. Note that transformations are applied in the order they are
            listed.
          </div>
          <TransformationsPane {queryManager} />
        {/if}
      {:else if inputColumnsFetchState?.state === 'failure'}
        <ErrorBox>
          Failed to fetch column information:
          {inputColumnsFetchState?.errors.join(';')}
        </ErrorBox>
      {/if}
    </TabContainer>
  </section>
</aside>

<style lang="scss">
  aside.input-sidebar {
    width: var(--input-pane-width);
    flex-basis: var(--input-pane-width);
    border-right: 1px solid var(--slate-300);
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    header {
      padding: var(--size-xx-small) var(--size-large);
      border-bottom: 1px solid var(--slate-200);
      font-weight: 590;
    }

    .input-pane {
      flex-grow: 1;
      overflow: hidden;
      position: relative;
      background-color: var(--sand-100);

      .loading-state {
        padding: var(--size-large);
      }

      .help-text {
        padding: var(--size-large);
        font-size: var(--text-size-small);
      }
    }
  }
</style>
