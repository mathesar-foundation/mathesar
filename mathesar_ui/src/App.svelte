<script lang="ts">
  import { Route } from 'tinro';
  import Base from '@mathesar/sections/Base.svelte';
  import Schemas from '@mathesar/pages/schemas/Schemas.svelte';
  import Header from './header/Header.svelte';
</script>

<Header/>

<section class="content-section">
  <Route path="/*" firstmatch>
    <Route path="/:db/schemas" let:meta>
      <Schemas database={meta.params.db}/>
    </Route>
    <Route path="/:db/:schema" let:meta>
      <Base database={meta.params.db} schemaId={parseInt(meta.params.schema, 10)}/>
    </Route>
    <Route path="/:db" redirect="/:db/schemas"/>
  </Route>
</section>

<style global lang="scss">
  @import "App.scss";
</style>
