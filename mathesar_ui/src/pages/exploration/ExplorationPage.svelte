<script lang="ts">
  import { router } from 'tinro';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import {
    ExplorationResult,
    QueryModel,
    QueryRunner,
    ExplorationInspector,
  } from '@mathesar/systems/data-explorer';
  import type { QueryInstance } from '@mathesar/api/types/queries';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
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

  function gotoSchemaPage() {
    router.goto(getSchemaPageUrl(database.name, schema.id));
  }
</script>

<svelte:head>
  <title>{query.name} | {schema.name} | Mathesar</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  {#if queryRunner}
    <div class="exploration-page">
      <Header bind:isInspectorOpen {query} {database} {schema} />
      <div class="content">
        <ExplorationResult {queryRunner} isExplorationPage />
        {#if isInspectorOpen}
          <ExplorationInspector
            queryHandler={queryRunner}
            on:delete={gotoSchemaPage}
          />
        {/if}
      </div>
    </div>
  {/if}
</LayoutWithHeader>

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
