<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import type { QueryInstance } from '@mathesar/api/rest/types/queries';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { abstractTypesMap } from '@mathesar/stores/abstract-types';
  import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
  import {
    ExplorationResult,
    QueryModel,
    QueryRunner,
    WithExplorationInspector,
  } from '@mathesar/systems/data-explorer';
  import type { ShareConsumer } from '@mathesar/utils/shares';

  import Header from './Header.svelte';

  export let database: Database;
  export let schema: Schema;
  export let query: QueryInstance;
  export let shareConsumer: ShareConsumer | undefined = undefined;

  $: schemaName = schema.name;

  let queryRunner: QueryRunner | undefined;
  let isInspectorOpen = true;

  function createQueryRunner(
    _query: QueryInstance,
    abstractTypeMap: AbstractTypesMap,
  ) {
    queryRunner?.destroy();
    queryRunner = new QueryRunner({
      query: new QueryModel(_query),
      abstractTypeMap,
      runMode: 'queryId',
      shareConsumer,
    });
  }

  let context: 'shared-consumer-page' | 'page' = 'page';
  $: context = shareConsumer ? 'shared-consumer-page' : 'page';
  $: createQueryRunner(query, abstractTypesMap);

  function gotoSchemaPage() {
    router.goto(getSchemaPageUrl(database.id, schema.oid));
  }
</script>

<svelte:head>
  <title>{query.name} | {$schemaName} | {$_('mathesar')}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  {#if queryRunner}
    <div class="exploration-page">
      <Header bind:isInspectorOpen {query} {database} {schema} {context} />
      <WithExplorationInspector
        {isInspectorOpen}
        queryHandler={queryRunner}
        on:delete={gotoSchemaPage}
      >
        <ExplorationResult queryHandler={queryRunner} isExplorationPage />
      </WithExplorationInspector>
    </div>
  {/if}
</LayoutWithHeader>

<style>
  .exploration-page {
    display: grid;
    grid-template: auto 1fr / 1fr;
    height: 100%;
  }
</style>
