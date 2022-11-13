<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader2 from '@mathesar/layouts/LayoutWithHeader2.svelte';
  import {
    ExplorationResult,
    QueryModel,
    QueryRunner,
    ExplorationInspector,
  } from '@mathesar/systems/data-explorer';
  import type { QueryInstance } from '@mathesar/api/queries';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
  import Header from './Header.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let query: QueryInstance;

  let queryRunner: QueryRunner | undefined;
  let isInspectorOpen = true;

  function createQueryRunner(
    _query: QueryInstance,
    abstractTypesMap: AbstractTypesMap,
  ) {
    queryRunner?.destroy();
    queryRunner = new QueryRunner(new QueryModel(_query), abstractTypesMap);
  }

  $: createQueryRunner(query, $currentDbAbstractTypes.data);
</script>

<svelte:head>
  <title>{query.name} | {schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader2 fitViewport restrictWidth={false}>
  {#if queryRunner}
    <div class="exploration-page">
      <Header bind:isInspectorOpen {query} {database} {schema} />
      <div class="content">
        <ExplorationResult {queryRunner} />
        {#if isInspectorOpen}
          <ExplorationInspector queryHandler={queryRunner} />
        {/if}
      </div>
    </div>
  {/if}
</LayoutWithHeader2>

<style lang="scss">
  .exploration-page {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;

    .content {
      display: flex;
      --exploration-inspector-width: 22.9rem;
      overflow: hidden;
      overflow-x: auto;
    }
  }
</style>
