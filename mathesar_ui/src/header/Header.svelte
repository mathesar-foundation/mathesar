<script lang="ts">
  import {
    faDragon,
    faUser,
  } from '@fortawesome/free-solid-svg-icons';

  import { currentDBName } from '@mathesar/stores/databases';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { newImport } from '@mathesar/stores/fileImports';

  import {
    Icon,
    Button,
  } from '@mathesar-components';

  import SchemaSelector from './schema-selector/SchemaSelector.svelte';

  function createNewTable() {
    //
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
