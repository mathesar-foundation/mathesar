<script lang="ts">
  import { Button, Icon } from '@mathesar-component-library';
  import {
    iconAddNew,
    iconFiltering,
    iconGrouping,
    iconDelete,
  } from '@mathesar/icons';
  import { DropdownMenu, MenuItem } from '@mathesar-component-library';
  import type QueryManager from '../QueryManager';
  import FilterTransformation from './FilterTransformation.svelte';
  import QueryFilterTransformationModel from '../QueryFilterTransformationModel';

  export let queryManager: QueryManager;

  $: ({ processedQueryColumns, processedQueryColumnHistory, query } =
    queryManager);
  $: ({ transformationModels } = $query);

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
              processedQueryColumnHistory={$processedQueryColumnHistory}
              bind:model={transformationModel}
              limitEditing={index !== transformationModels.length - 1}
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
