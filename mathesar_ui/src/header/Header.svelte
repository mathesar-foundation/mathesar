<script lang="ts">
  import {
    faDragon,
    faUser,
  } from '@fortawesome/free-solid-svg-icons';

  import { currentDB } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
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

  {#if $currentDB}
    <SchemaSelector/>
  {/if}

  <div class="right-options">
    {#if $currentSchema}
      <div class="quick-links">
        <Button on:click={() => newImport($currentDB.name)}>
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
