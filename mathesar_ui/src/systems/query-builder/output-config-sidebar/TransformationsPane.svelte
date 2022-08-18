<script lang="ts">
  import {
    Button,
    Icon,
    Spinner,
    DropdownMenu,
    MenuItem,
    ImmutableMap,
  } from '@mathesar-component-library';
  import {
    iconAddNew,
    iconFiltering,
    iconGrouping,
    iconDelete,
  } from '@mathesar/icons';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
  import type QueryManager from '../QueryManager';
  import { processColumn } from '../utils';
  import type { ProcessedQueryResultColumnMap } from '../utils';
  import FilterTransformation from './FilterTransformation.svelte';
  import QueryFilterTransformationModel from '../QueryFilterTransformationModel';
  import type QueryModel from '../QueryModel';
  import type { InputColumnsStoreSubstance } from '../InputColumnsManager';

  export let queryManager: QueryManager;
  export let inputColumns: InputColumnsStoreSubstance;

  $: ({ processedQueryColumns, query } = queryManager);
  $: ({ transformationModels } = $query);
  $: ({ requestStatus } = inputColumns);

  function calculateAllTransformableColumns(
    _query: QueryModel,
    _inputColumns: InputColumnsStoreSubstance,
    _abstractTypes: AbstractTypesMap,
  ): ProcessedQueryResultColumnMap {
    const transformableColumns: ProcessedQueryResultColumnMap =
      new ImmutableMap(
        _query.initial_columns.map((entry) => [
          entry.alias,
          processColumn(
            {
              alias: entry.alias,
              display_name: entry.display_name,
              type:
                _inputColumns.columnInformationMap.get(entry.id)?.type ??
                'unknown',
              type_options: null,
              display_options: null,
            },
            _abstractTypes,
          ),
        ]),
      );
    // TODO: Identify virtual columns and merge them to this map
    return transformableColumns;
  }

  $: allTransformableColumns = calculateAllTransformableColumns(
    $query,
    inputColumns,
    $currentDbAbstractTypes.data,
  );

  async function addFilter() {
    const firstColumn = [...$processedQueryColumns.values()][0];
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

  async function updateTransformation() {
    await queryManager.update((q) =>
      q.withTransformationModels(transformationModels),
    );
  }
</script>

<div>
  {#if requestStatus.state === 'processing'}
    <Spinner />
  {:else if requestStatus.state === 'success'}
    {#if transformationModels}
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
                processedQueryColumns={$processedQueryColumns}
                {allTransformableColumns}
                bind:model={transformationModel}
                limitEditing={index !== transformationModels.length - 1 ||
                  $processedQueryColumns.size === 0}
                on:update={updateTransformation}
              />
            {:else}
              <i>Summarization - yet to implement</i>
            {/if}
          </div>
        </section>
      {/each}
    {/if}

    {#if $processedQueryColumns.size > 0}
      <DropdownMenu label="Add transformation step" icon={iconAddNew}>
        <MenuItem icon={iconFiltering} on:click={addFilter}>Filter</MenuItem>
        <MenuItem icon={iconGrouping}>Summarize (Yet to implement)</MenuItem>
      </DropdownMenu>
    {/if}
  {:else if requestStatus.state === 'failure'}
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
