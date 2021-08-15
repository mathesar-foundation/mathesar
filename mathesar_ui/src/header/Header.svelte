<script lang="ts">
  import { get } from 'svelte/store';
  import {
    faDragon,
    faUser,
  } from '@fortawesome/free-solid-svg-icons';

  import { currentDBName } from '@mathesar/stores/databases';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { newImport, importStatuses } from '@mathesar/stores/fileImports';
  import {
    addTab,
  } from '@mathesar/stores/tabs';

  import {
    Icon,
    Button,
  } from '@mathesar-components';

  import SchemaSelector from './schema-selector/SchemaSelector.svelte';
  import ImportIndicator from './import-indicator/ImportIndicator.svelte';

  function createNewTable() {
    if ($currentDBName && $currentSchemaId) {
      const fileData = get(newImport($currentDBName, $currentSchemaId));
      addTab($currentDBName, $currentSchemaId, {
        id: fileData.id,
        label: fileData.name || 'New table',
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
        <Button on:click={createNewTable}>
          New table
        </Button>
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
