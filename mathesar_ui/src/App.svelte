<script lang="ts">
  import { Route, active } from 'tinro';
  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import Base from '@mathesar/sections/Base.svelte';

  const commonData = preloadCommonData();
  const selectedDb = commonData?.databases?.[0];
</script>

<header>
  <div class="dropdown">
    {#if selectedDb}
      <div>{selectedDb}</div>
    {/if}
  </div>
  <a href='/{selectedDb}/import' use:active data-exact>Import CSV</a>
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
