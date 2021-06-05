<script lang="ts">
  import { Route } from 'tinro';
  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import Base from '@mathesar/sections/Base.svelte';
  import { newImport } from '@mathesar/stores/fileImports';

  const commonData = preloadCommonData();
  const selectedDb = commonData?.databases?.[0];
</script>

<header>
  <div class="dropdown">
    {#if selectedDb}
      <div>{selectedDb}</div>
    {/if}
  </div>
  <button on:click={() => newImport()}>Import CSV</button>
</header>

<section class="content-section">
  <Route path="/:db">
    <Base database={selectedDb}/>
  </Route>
  
  <Route path="/" redirect="/{selectedDb}"/>
</section>

<style global lang="scss">
  @import "App.scss";
</style>
