<script lang="ts">
  import { router } from 'tinro';
  import { get } from 'svelte/store';
  import {
    faDragon,
    faUser,
    faPlus,
    faUpload,
    faTable,
    faFileContract,
  } from '@fortawesome/free-solid-svg-icons';
  import { createTable, refetchTablesForSchema } from '@mathesar/stores/tables';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { currentDBName } from '@mathesar/stores/databases';
  import { newImport, importStatuses } from '@mathesar/stores/fileImports';
  import {
    getTabsForSchema,
    constructImportTab,
    constructTabularTab,
  } from '@mathesar/stores/tabs';

  import { Icon, DropdownMenu, MenuItem } from '@mathesar-component-library';
  import { TabularType } from '@mathesar/stores/table-data';

  import SchemaSelector from './schema-selector/SchemaSelector.svelte';
  import ImportIndicator from './import-indicator/ImportIndicator.svelte';

  async function handleCreateEmptyTable() {
    if (!$currentSchemaId) {
      return;
    }
    const table = await createTable($currentSchemaId);
    await refetchTablesForSchema($currentSchemaId);
    const tab = constructTabularTab(TabularType.Table, table.id, table.name);
    getTabsForSchema($currentDBName, $currentSchemaId).add(tab);
  }

  function beginDataImport() {
    if ($currentDBName && $currentSchemaId) {
      const fileData = get(newImport($currentDBName, $currentSchemaId));
      const tab = constructImportTab(fileData.id, fileData.name);
      getTabsForSchema($currentDBName, $currentSchemaId).add(tab);
    }
  }

  function redirectToNewQueryRoute() {
    router.goto(`/${$currentDBName}/${String($currentSchemaId)}/queries/`);
  }
</script>

<header>
  <div class="logo">
    <div class="image-wrapper">
      <Icon data={faDragon} />
    </div>
  </div>

  {#if $currentDBName}
    <SchemaSelector />
  {/if}

  <div class="right-options">
    <ImportIndicator importStatusMap={$importStatuses} />

    {#if $currentSchemaId}
      <div class="quick-links">
        <DropdownMenu label="New" icon={{ data: faPlus }}>
          <MenuItem on:click={handleCreateEmptyTable} icon={{ data: faTable }}>
            New Empty Table
          </MenuItem>
          <MenuItem
            on:click={redirectToNewQueryRoute}
            icon={{ data: faFileContract }}>New Query</MenuItem
          >
          <MenuItem on:click={beginDataImport} icon={{ data: faUpload }}>
            Import Data into New Table
          </MenuItem>
        </DropdownMenu>
      </div>
    {/if}

    <div class="image-wrapper">
      <Icon data={faUser} />
    </div>
  </div>
</header>

<style global lang="scss">
  @import 'Header.scss';
</style>
