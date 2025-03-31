<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import PhraseContainingIdentifier from '@mathesar/components/PhraseContainingIdentifier.svelte';
  import { confirm } from '@mathesar/stores/confirmation';
  import { getAvailableName } from '@mathesar/utils/db';
  import { Spinner, TabContainer } from '@mathesar-component-library';

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
        title: {
          component: PhraseContainingIdentifier,
          props: {
            identifier: column.name,
            wrappingString: $_('summarize_column_with_identifier'),
          },
        },
        body: [
          $_('summarize_column_recommendation'),
          $_('summarize_column_configure'),
        ],
        proceedButton: {
          label: $_('yes_summarize_as_list'),
          icon: undefined,
        },
        cancelButton: {
          label: $_('no_continue_without_summarization'),
          icon: undefined,
        },
      });
    }
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
    // Select transformations tab is auto summarization is added
    if (addNewAutoSummarization) {
      [, activeTab] = tabs;
    }
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

<style lang="scss">
  aside.input-sidebar {
    height: 100%;
    border-right: 1px solid var(--inspector-border);
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .input-pane {
      flex-grow: 1;
      overflow: hidden;
      position: relative;
      background-color: var(--inspector-background);

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
