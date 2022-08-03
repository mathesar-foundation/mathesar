<script lang="ts">
  import { router } from 'tinro';
  import { get } from 'svelte/store';
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

  import { iconAdd, iconDragon, iconFileContract, iconTable, iconUpload, iconUser } from '@mathesar/icons';
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
      <Icon {...iconDragon} />
    </div>
  </div>

  {#if $currentDBName}
    <SchemaSelector />
  {/if}

  <div class="right-options">
    <ImportIndicator importStatusMap={$importStatuses} />

    {#if $currentSchemaId}
      <div class="quick-links">
        <DropdownMenu label="New" icon={iconAdd}>
          <MenuItem on:click={handleCreateEmptyTable} icon={iconTable}>
            New Empty Table
          </MenuItem>
          <MenuItem
            on:click={redirectToNewQueryRoute}
            icon={iconFileContract}>New Query</MenuItem
          >
          <MenuItem on:click={beginDataImport} icon={iconUpload}>
            Import Data into New Table
          </MenuItem>
        </DropdownMenu>
      </div>
    {/if}

    <div class="image-wrapper">
      <Icon {...iconUser} />
    </div>
  </div>
</header>

<style global lang="scss">
  @import 'Header.scss';
</style>
