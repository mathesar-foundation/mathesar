<script lang="ts">
  import { get } from 'svelte/store';
  import {
    faDragon,
    faUser,
    faPlus,
    faUpload,
    faTable,
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

  import { Icon, Button, Dropdown } from '@mathesar-component-library';
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
        <Dropdown closeOnInnerClick={true} ariaLabel="New Table">
          <svelte:fragment slot="trigger">
            <div class="new-table">
              <Icon data={faPlus} />
              <span class="label">New Table</span>
            </div>
          </svelte:fragment>
          <svelte:fragment slot="content">
            <div class="new-table-options">
              <Button on:click={handleCreateEmptyTable} appearance="plain">
                <Icon data={faTable} size="0.8em" />
                <span>Empty Table</span>
              </Button>
              <Button on:click={beginDataImport} appearance="plain">
                <Icon data={faUpload} size="0.8em" />
                <span>Import Data</span>
              </Button>
            </div>
          </svelte:fragment>
        </Dropdown>
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
