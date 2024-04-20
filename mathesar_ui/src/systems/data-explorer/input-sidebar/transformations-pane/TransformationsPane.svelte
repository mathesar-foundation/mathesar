<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconAddNew, iconDeleteMajor } from '@mathesar/icons';
  import {
    Button,
    ButtonMenuItem,
    Collapsible,
    DropdownMenu,
    Icon,
    ImmutableMap,
  } from '@mathesar-component-library';

  import FilterTransformation from './FilterTransformation.svelte';
  import HideTransformation from './HideTransformation.svelte';
  import SortTransformation from './SortTransformation.svelte';
  import SummarizationTransformation from './summarization/SummarizationTransformation.svelte';
  import { calcAllowedColumnsPerTransformation } from './transformationUtils';
  import QueryFilterTransformationModel from '../../QueryFilterTransformationModel';
  import QueryHideTransformationModel from '../../QueryHideTransformationModel';
  import type QueryManager from '../../QueryManager';
  import type { QueryTransformationModel } from '../../QueryModel';
  import QuerySortTransformationModel from '../../QuerySortTransformationModel';
  import QuerySummarizationTransformationModel from '../../QuerySummarizationTransformationModel';

  export let queryManager: QueryManager;

  $: ({ query, processedColumns, columnsMetaData } = queryManager);
  $: ({ initial_columns, transformationModels } = $query);

  $: allowedColumnsPerTransformation = calcAllowedColumnsPerTransformation(
    initial_columns,
    transformationModels,
    $columnsMetaData,
  );
  $: sortableColumnsForNextStep = $query.getAllSortableColumns();
  $: isSortableColumnPresent = sortableColumnsForNextStep.length > 0;

  async function addFilter() {
    const firstColumn = [...$processedColumns.values()][0];
    if (!firstColumn) {
      return;
    }
    const firstCondition = [...firstColumn.allowedFiltersMap.values()][0];
    if (!firstCondition) {
      return;
    }
    const newFilter = new QueryFilterTransformationModel({
      columnIdentifier: firstColumn.column.alias,
      conditionIdentifier: firstCondition.id,
      value: firstColumn.initialInputValue,
    });
    await queryManager.update((q) => q.addFilterTransform(newFilter));
  }

  async function addSummarization() {
    const allColumns = [...$processedColumns.values()];
    // TODO: Check and select first basetable column!
    const firstColumn = allColumns[0];
    if (!firstColumn) {
      return;
    }
    const newSummarization = new QuerySummarizationTransformationModel({
      columnIdentifier: firstColumn.column.alias,
      groups: new ImmutableMap(),
      aggregations: new ImmutableMap(),
    });
    await queryManager.update((q) =>
      q.addSummarizationTransform(newSummarization),
    );
  }

  async function addHideTransform() {
    const newHide = new QueryHideTransformationModel({
      columnAliases: [],
    });
    await queryManager.update((q) => q.addHideTransform(newHide));
  }

  async function addSortTransform() {
    const firstColumn = sortableColumnsForNextStep[0];
    if (!firstColumn) {
      return;
    }
    const newSort = new QuerySortTransformationModel({
      columnIdentifier: firstColumn,
      sortDirection: 'ASCENDING',
    });
    await queryManager.update((q) => q.addSortTransform(newSort));
  }

  async function removeLastTransformation() {
    await queryManager.update((q) => q.removeLastTransform());
  }

  /**
   * Transformations are currently mutable within the FilterTransformation &
   * SummarizationTransformation components.
   *
   * TODO:
   * 1. Make them immutable.
   * 2. Check if transformations are different from what is present in query
   *    before updating.
   */
  async function updateTransformation(
    index: number,
    transformationModel: QueryTransformationModel,
  ) {
    await queryManager.update((q) =>
      q.updateTransform(index, transformationModel),
    );
  }
</script>

<div class="transformations">
  {#if transformationModels && allowedColumnsPerTransformation.length === transformationModels.length}
    {#each transformationModels as transformationModel, index (transformationModel)}
      <Collapsible isOpen triggerAppearance="plain">
        <span slot="header" class="header">
          <span class="number">
            {index + 1}
          </span>
          <span class="title">
            {transformationModel.name}
          </span>
          {#if index === transformationModels.length - 1}
            <Button
              appearance="plain"
              class="padding-zero"
              on:click={() => removeLastTransformation()}
            >
              <Icon {...iconDeleteMajor} size="0.8rem" />
            </Button>
          {/if}
        </span>
        <div slot="content" class="content">
          {@const hasNoColumns =
            allowedColumnsPerTransformation[index].size === 0}
          {#if transformationModel.type === 'filter'}
            <FilterTransformation
              columns={allowedColumnsPerTransformation[index]}
              model={transformationModel}
              limitEditing={hasNoColumns}
              totalTransformations={transformationModels.length}
              on:update={() => updateTransformation(index, transformationModel)}
            />
          {:else if transformationModel.type === 'summarize'}
            <SummarizationTransformation
              columns={allowedColumnsPerTransformation[index]}
              model={transformationModel}
              limitEditing={hasNoColumns ||
                index < transformationModels.length - 1}
              on:update={() => updateTransformation(index, transformationModel)}
            />
          {:else if transformationModel.type === 'hide'}
            <HideTransformation
              columns={allowedColumnsPerTransformation[index]}
              model={transformationModel}
              limitEditing={hasNoColumns}
              on:update={() => updateTransformation(index, transformationModel)}
            />
          {:else if transformationModel.type === 'order'}
            <SortTransformation
              columns={allowedColumnsPerTransformation[index]}
              columnsAllowedForSelection={[
                ...allowedColumnsPerTransformation[index]
                  .without($query.getAllSortedColumns())
                  .values(),
              ].map((entry) => entry.column.alias)}
              model={transformationModel}
              limitEditing={hasNoColumns}
              on:update={() => updateTransformation(index, transformationModel)}
            />
          {/if}
        </div>
      </Collapsible>
    {/each}
  {/if}

  <div class="add-transform-control">
    <DropdownMenu
      label={$_('add_transformation_step')}
      icon={iconAddNew}
      disabled={$processedColumns.size === 0}
      triggerAppearance="secondary"
    >
      <ButtonMenuItem on:click={addFilter}>{$_('filter')}</ButtonMenuItem>
      <ButtonMenuItem
        disabled={!isSortableColumnPresent}
        on:click={addSortTransform}>{$_('sort')}</ButtonMenuItem
      >
      <ButtonMenuItem
        disabled={$query.hasSummarizationTransform()}
        on:click={addSummarization}
      >
        {$_('summarize')}
      </ButtonMenuItem>
      <ButtonMenuItem on:click={addHideTransform}>
        {$_('hide_columns')}
      </ButtonMenuItem>
    </DropdownMenu>
  </div>
</div>

<style lang="scss">
  .transformations {
    margin-bottom: var(--size-large);

    :global(.collapsible .collapsible-header) {
      padding: var(--size-ultra-small) var(--size-large);
    }

    .header {
      display: flex;
      align-items: center;
      gap: 0.3rem;

      .number {
        border: 1px solid var(--color-gray-medium);
        border-radius: 100%;
        font-size: var(--text-size-x-small);
        font-variant-numeric: tabular-nums;
        padding: 0.125em 0.4em;
        font-weight: 500;
      }

      .title {
        flex-grow: 1;
        font-weight: 500;
      }
    }

    .content {
      padding: var(--size-small) var(--size-large) var(--size-large)
        var(--size-super-ultra-large);
    }

    .add-transform-control {
      padding: var(--size-small) var(--size-large);

      :global(.dropdown.trigger) {
        width: 100%;
      }
    }
  }
</style>
