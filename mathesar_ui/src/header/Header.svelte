<script lang="ts">
  import { get } from 'svelte/store';
  import {
    faDragon,
    faUser,
    faPlus,
    faUpload,
    faTable,
  } from '@fortawesome/free-solid-svg-icons';
  import { postAPI } from '@mathesar/utils/api';
  import { currentDBName } from '@mathesar/stores/databases';
  import { currentSchemaId, refetchSchema } from '@mathesar/stores/schemas';
  import { newImport, importStatuses } from '@mathesar/stores/fileImports';
  import {
    addTab,
  } from '@mathesar/stores/tabs';

  import {
    Icon,
    Button,
    Dropdown,
  } from '@mathesar-components';

  import SchemaSelector from './schema-selector/SchemaSelector.svelte';
  import ImportIndicator from './import-indicator/ImportIndicator.svelte';

  async function createEmptyTable() {
    const response = await postAPI<{ id: number, name: string }>('/tables/', {
      schema: $currentSchemaId as number,
    });
    const { id, name } = response;
    await refetchSchema($currentDBName, $currentSchemaId);
    addTab($currentDBName, $currentSchemaId, { id, label: name });
  }

  function beginDataImport() {
    if ($currentDBName && $currentSchemaId) {
      const fileData = get(newImport($currentDBName, $currentSchemaId));
      addTab($currentDBName, $currentSchemaId, {
        id: fileData.id,
        label: fileData.name || 'Import data',
        isNew: true,
      });
    }
  }
</script>

<header>
  <div class="logo">
    <div class="image-wrapper">
      <Icon data={faDragon}/>
    </div>
  </div>

  {#if $currentDBName}
    <SchemaSelector/>
  {/if}

  <div class="right-options">
    <ImportIndicator importStatusMap={$importStatuses}/>

    {#if $currentSchemaId}
      <div class="quick-links">
        
        <Dropdown closeOnInnerClick={true} ariaLabel="New table">
          <svelte:fragment slot="trigger">
            <div class="new-table">
              <Icon data={faPlus}/>
              <span class="label">New table</span>
            </div>
          </svelte:fragment>
          <svelte:fragment slot="content">
            <div class="new-table-options">
              <Button on:click={createEmptyTable} appearance="plain">
                <Icon data={faTable} size="0.8em"/>
                <span>Empty table</span>
              </Button>
              <Button on:click={beginDataImport} appearance="plain">
                <Icon data={faUpload} size="0.8em"/>
                <span>Import data</span>
              </Button>
            </div>
          </svelte:fragment>
        </Dropdown>
      </div>
    {/if}

    <div class="image-wrapper">
      <Icon data={faUser}/>
    </div>
  </div>
</header>

<style global lang="scss">
  @import "Header.scss";
</style>
