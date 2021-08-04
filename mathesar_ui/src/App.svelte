<script lang="ts">
  import { Route } from 'tinro';
  import { selectedDB } from '@mathesar/stores/databases';
  import Base from '@mathesar/sections/Base.svelte';
  import Schemas from '@mathesar/pages/schemas/Schemas.svelte';
  import Header from './header/Header.svelte';
</script>

<Header/>

<section class="content-section">
  {#if $selectedDB}
    <Route path="/:db/*" firstmatch>
      <Route path="/schemas">
        <Schemas/>
      </Route>
      <Route path="/:schema">
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
