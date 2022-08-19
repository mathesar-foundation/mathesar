<script lang="ts">
  import {
    Button,
    Icon,
    Spinner,
    DropdownMenu,
    MenuItem,
  } from '@mathesar-component-library';
  import {
    iconAddNew,
    iconFiltering,
    iconGrouping,
    iconDelete,
  } from '@mathesar/icons';
  import type QueryManager from '../QueryManager';
  import FilterTransformation from './FilterTransformation.svelte';
  import QueryFilterTransformationModel from '../QueryFilterTransformationModel';
  import type { QueryTransformationModel } from '../QueryModel';
  import { calcAllowedColumnsPerTransformation } from './transformationUtils';

  export let queryManager: QueryManager;

  $: ({
    query,
    processedResultColumns,
    processedInitialColumns,
    processedVirtualColumns,
    state,
  } = queryManager);
  $: ({ transformationModels } = $query);
  $: ({ inputColumnsFetchState } = $state);

  $: allowedColumnsPerTransformation = calcAllowedColumnsPerTransformation(
    transformationModels,
    $processedInitialColumns,
    $processedVirtualColumns,
  );

  async function addFilter() {
    const firstColumn = [...$processedResultColumns.values()][0];
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
      value: undefined,
    });
    await queryManager.update((q) =>
      q.withTransformationModels([...transformationModels, newFilter]),
    );
  }

  async function removeTransformation(index: number) {
    transformationModels.splice(index, 1);
    await queryManager.update((q) =>
      q.withTransformationModels(transformationModels),
    );
  }

  async function updateTransformation(
    model: QueryTransformationModel,
    index: number,
  ) {
    // Check if transformation is different from what is present in query
    // before updating
    await queryManager.update((q) =>
      q.withTransformationModels(transformationModels),
    );
  }
</script>

<div>
  {#if inputColumnsFetchState?.state === 'processing'}
    <Spinner />
  {:else if inputColumnsFetchState?.state === 'success'}
    {#if transformationModels && allowedColumnsPerTransformation.length === transformationModels.length}
      {#each transformationModels as transformationModel, index (transformationModel)}
        <section class="transformation">
          <header>
            <span class="number">
              {index + 1}
            </span>
            <span class="title">
              {#if transformationModel instanceof QueryFilterTransformationModel}
                Filter
              {:else}
                Summarization
              {/if}
            </span>
            {#if index === transformationModels.length - 1}
              <Button
                appearance="plain"
                class="padding-zero"
                on:click={() => removeTransformation(index)}
              >
                <Icon {...iconDelete} size="0.8rem" />
              </Button>
            {/if}
          </header>
          <div class="content">
            {#if transformationModel instanceof QueryFilterTransformationModel}
              <FilterTransformation
                columns={allowedColumnsPerTransformation[index]}
                model={transformationModel}
                limitEditing={allowedColumnsPerTransformation[index].size === 0}
                on:update={() =>
                  updateTransformation(transformationModel, index)}
              />
            {:else}
              <i>Summarization - yet to implement</i>
            {/if}
          </div>
        </section>
      {/each}
    {/if}

    <DropdownMenu
      label="Add transformation step"
      icon={iconAddNew}
      disabled={$processedResultColumns.size === 0}
    >
      <MenuItem icon={iconFiltering} on:click={addFilter}>Filter</MenuItem>
      <MenuItem icon={iconGrouping}>Summarize (Yet to implement)</MenuItem>
    </DropdownMenu>
  {:else if inputColumnsFetchState?.state === 'failure'}
    Failed to fetch column information
  {/if}
</div>

<style lang="scss">
  .transformation {
    border: 1px solid var(--color-gray-medium);
    padding: 0.5rem;
    border-radius: 3px;
    background: var(--color-gray-lighter);
    margin-bottom: 1rem;

    header {
      display: flex;
      align-items: center;
      margin-bottom: 0.6rem;
      gap: 0.3rem;

      .number {
        border: 1px solid var(--color-gray-medium);
        border-radius: 100%;
        font-size: var(--text-size-x-small);
        padding: 0.125em 0.5em;
      }

      .title {
        flex-grow: 1;
        font-weight: 500;
      }
    }
  }
</style>
