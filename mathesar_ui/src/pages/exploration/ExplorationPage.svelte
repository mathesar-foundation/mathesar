<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import type { QueryInstance } from '@mathesar/api/types/queries';
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { getSchemaPageUrl } from '@mathesar/routes/urls';
  import { currentDbAbstractTypes } from '@mathesar/stores/abstract-types';
  import type { AbstractTypesMap } from '@mathesar/stores/abstract-types/types';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    ExplorationResult,
    QueryModel,
    QueryRunner,
    WithExplorationInspector,
  } from '@mathesar/systems/data-explorer';
  import type { ShareConsumer } from '@mathesar/utils/shares';
  import Header from './Header.svelte';

  const userProfile = getUserProfileStoreFromContext();

  export let database: Database;
  export let schema: SchemaEntry;
  export let query: QueryInstance;
  export let shareConsumer: ShareConsumer | undefined = undefined;

  $: canEditMetadata =
    $userProfile?.hasPermission({ database, schema }, 'canEditMetadata') ??
    false;

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
  $: createQueryRunner(query, $currentDbAbstractTypes.data);

  function gotoSchemaPage() {
    router.goto(getSchemaPageUrl(database.id, schema.id));
  }
</script>

<svelte:head>
  <title>{query.name} | {schema.name} | {$_('mathesar')}</title>
</svelte:head>

<LayoutWithHeader fitViewport>
  {#if queryRunner}
    <div class="exploration-page">
      <Header
        bind:isInspectorOpen
        {query}
        {database}
        {schema}
        {canEditMetadata}
        {context}
      />
      <WithExplorationInspector
        {isInspectorOpen}
        queryHandler={queryRunner}
        {canEditMetadata}
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
