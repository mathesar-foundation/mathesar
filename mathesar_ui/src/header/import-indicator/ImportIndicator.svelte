<script lang="ts">
  import { router } from 'tinro';
  import { States } from '@mathesar/utils/api';
  import {
    Dropdown,
  } from '@mathesar-component-library';

  import type {
    FileImportStatusMap,
    FileImportStatusInfo,
  } from '@mathesar/stores/fileImports';
  import {
    getTabsForSchema,
    constructImportTab,
  } from '@mathesar/stores/tabs';
  import {
    currentSchemaId,
    getSchemaInfo,
  } from '@mathesar/stores/schemas';

  export let importStatusMap: FileImportStatusMap;
  let isOpen = false;

  function getNonIdleImports(_importStatusMap: FileImportStatusMap) {
    const imports: FileImportStatusInfo[] = [];
    _importStatusMap.forEach((fileImport) => {
      if (fileImport.status !== States.Idle) {
        imports.push(fileImport);
      }
    });
    return imports;
  }

  $: nonIdleImports = getNonIdleImports(importStatusMap);

  function openImport(importInfo: FileImportStatusInfo) {
    if ($currentSchemaId !== importInfo.schemaId) {
      router.goto(`/${importInfo.databaseName}/${importInfo.schemaId}/`);
    }
    const tabList = getTabsForSchema(
      importInfo.databaseName,
      importInfo.schemaId,
    );
    const tab = constructImportTab(
      importInfo.id,
      importInfo.name,
    );
    tabList.add(tab);
    isOpen = false;
  }
</script>

{#if nonIdleImports.length > 0}
  <Dropdown bind:isOpen triggerAppearance="plain" placement="bottom-end"
            triggerClass="import-indicator"
            contentClass="import-content">
    <svelte:fragment slot="trigger">
      {nonIdleImports.length} table creation in progress
    </svelte:fragment>

    <svelte:fragment slot="content">
      {#each nonIdleImports as fileImport (fileImport.id)}
        <div class="import" on:click={() => openImport(fileImport)}>
          <div class="location">
            {fileImport.databaseName}
            /
            {getSchemaInfo(fileImport.databaseName, fileImport.schemaId)?.name || ''}
          </div>
          <div class="name">
            {fileImport.name || fileImport.dataFileName}
          </div>
        </div>
      {/each}

      <div class="help-text">
        Closing the browser window may interrupt the jobs that are in progress.
      </div>
    </svelte:fragment>
  </Dropdown>
{/if}

<style global lang="scss">
  @import "ImportIndicator.scss";
</style>
