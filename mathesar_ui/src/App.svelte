<script lang="ts">
  import { Route } from 'tinro';

  import { selectedDB } from '@mathesar/stores/databases';
  import { newImport } from '@mathesar/stores/fileImports';

  import Base from '@mathesar/sections/Base.svelte';
  import Schemas from '@mathesar/pages/schemas/Schemas.svelte';
  import { Button } from '@mathesar-components';
</script>

<header>
  <div class="selector">
    <div>{$selectedDB?.name || ''}</div>
  </div>

  {#if $selectedDB}
    <div class="navigator">
      <Button on:click={() => newImport($selectedDB.name)}>
        Import CSV
      </Button>
      <a href="/{$selectedDB.name}/schemas/">
        Manage schemas
      </a>
    </div>
  {/if}
</header>

<section class="content-section">
  {#if $selectedDB}
    <Route path="/:db/*">
      <Route path="/schemas">
        {#key $selectedDB}
          <Schemas database={$selectedDB.name}/>
        {/key}
      </Route>
      <Route path="/">
        {#key $selectedDB}
          <Base database={$selectedDB.name}/>
        {/key}
      </Route>
    </Route>

    <Route path="/" redirect="/{$selectedDB.name}"/>
  {/if}
</section>

<style global lang="scss">
  @import "App.scss";
</style>
