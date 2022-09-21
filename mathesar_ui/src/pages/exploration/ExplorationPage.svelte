<script lang="ts">
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { getExplorationEditorPageUrl } from '@mathesar/routes/urls';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import {
    ExplorationResult,
    QueryModel,
    QueryRunner,
  } from '@mathesar/systems/data-explorer';
  import type { QueryInstance } from '@mathesar/api/queries';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';

  export let database: Database;
  export let schema: SchemaEntry;
  export let query: QueryInstance;

  let queryRunner: QueryRunner;

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
  <title>Exploration Name comes here | {schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  <div class="exploration-page">
    <a href={getExplorationEditorPageUrl(database.name, schema.id, query.id)}
      >Edit exploration in Data Explorer</a
    >

    {#if queryRunner}
      <ExplorationResult {queryRunner} />
    {/if}
  </div>
</LayoutWithHeader>

<style lang="scss">
  .exploration-page {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;
  }
</style>
