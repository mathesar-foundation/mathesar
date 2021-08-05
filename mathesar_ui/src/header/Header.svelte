<script lang="ts">
  import {
    faDragon,
    faUser,
  } from '@fortawesome/free-solid-svg-icons';

  import { selectedDB } from '@mathesar/stores/databases';
  import { selectedSchema } from '@mathesar/stores/schemas';
  import { newImport } from '@mathesar/stores/fileImports';

  import {
    Icon,
    Button,
  } from '@mathesar-components';

  import SchemaSelector from './schema-selector/SchemaSelector.svelte';
</script>

<header>
  <div class="logo">
    <div class="image-wrapper">
      <Icon data={faDragon}/>
    </div>
  </div>

  {#if $selectedDB}
    <SchemaSelector/>
  {/if}

  <div class="right-options">
    {#if $selectedSchema}
      <div class="quick-links">
        <Button on:click={() => newImport($selectedDB.name)}>
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
