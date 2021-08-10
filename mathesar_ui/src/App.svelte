<script lang="ts">
  import { Route } from 'tinro';
  import { currentDB } from '@mathesar/stores/databases';
  import Base from '@mathesar/sections/Base.svelte';
  import Schemas from '@mathesar/pages/schemas/Schemas.svelte';
  import Header from './header/Header.svelte';
</script>

<Header/>

<section class="content-section">
  {#if $currentDB}
    <Route path="/:db/*" firstmatch>
      <Route path="/schemas">
        <Schemas/>
      </Route>
      <Route path="/:schema">
        {#key $currentDB}
          <Base database={$currentDB.name}/>
        {/key}
      </Route>
    </Route>

    <Route path="/" redirect="/{$currentDB.name}"/>
  {/if}
</section>

<style global lang="scss">
  @import "App.scss";
</style>
