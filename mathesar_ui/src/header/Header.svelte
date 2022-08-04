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

<style lang="scss">
  header {
    display: flex;
    position: fixed;
    width: 100%;
    height: var(--top-pane-height);
    z-index: 4;
    align-items: center;
    top: 0;
    border-bottom: 1px solid #dfdfdf;

    .logo {
      flex-shrink: 0;
      flex-basis: 62px;
      border-right: 1px solid #dfdfdf;
    }

    .image-wrapper {
      text-align: center;
      width: 30px;
      height: 30px;
      padding: 7px;
      background: #d1d3d6;
      border-radius: 3px;
      margin-left: auto;
      margin-right: auto;
      display: flex;
      align-items: center;

      > :global(*) {
        flex-shrink: 0;
        flex-grow: 1;
      }
    }

    .right-options {
      margin-left: auto;
      margin-right: 15px;
      flex-grow: 0;
      flex-shrink: 0;
      display: flex;

      .quick-links {
        margin-right: 15px;
      }
    }
  }
</style>
