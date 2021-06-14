<script lang="ts">
  import { Route } from 'tinro';
  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import Base from '@mathesar/sections/Base.svelte';
  import { newImport } from '@mathesar/stores/fileImports';

  const commonData = preloadCommonData();
  const selectedDb = commonData?.databases?.[0];
</script>

<header>
  <div class="selector">
    {#if selectedDb}
      <div>{selectedDb}</div>
    {/if}
  </div>
  <div class="navigator">
    <button on:click={() => newImport(selectedDb)}>Import CSV</button>
  </div>
</header>

<section class="content-section">
  <Route path="/:db">
    {#key selectedDb}
      <Base database={selectedDb}/>
    {/key}
  </Route>
  
  <Route path="/" redirect="/{selectedDb}"/>
</section>

<style global lang="scss">
  @import "App.scss";
</style>
