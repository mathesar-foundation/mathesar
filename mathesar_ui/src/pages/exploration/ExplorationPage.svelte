<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import {
    ExplorationResult,
    QueryModel,
    QueryRunner,
  } from '@mathesar/systems/data-explorer';
  import type { QueryInstance } from '@mathesar/api/queries';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
  import ActionsPane from './ActionsPane.svelte';

  export let database: Database;
  export let schema: SchemaEntry;
  export let query: QueryInstance;

  let queryRunner: QueryRunner | undefined;

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

<LayoutWithHeader fitViewport>
  {#if queryRunner}
    <div class="exploration-page">
      <ActionsPane {query} {queryRunner} {database} {schema} />
      <ExplorationResult {queryRunner} />
    </div>
  {/if}
</LayoutWithHeader>

<style lang="scss">
  .exploration-page {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;
  }
</style>
