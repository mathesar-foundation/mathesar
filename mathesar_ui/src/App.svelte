<script lang="ts">
  import { Route } from 'tinro';
  import { ToastPresenter, Confirmation } from '@mathesar-component-library';
  import Base from '@mathesar/sections/Base.svelte';
  import Schemas from '@mathesar/pages/schemas/Schemas.svelte';
  import Header from '@mathesar/header/Header.svelte';
  import { toast } from '@mathesar/stores/toast';
  import { confirmationController } from '@mathesar/stores/confirmation';
</script>

<ToastPresenter entries={toast.entries} />
<Confirmation controller={confirmationController} />

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

<!--
  Supporting aliases in scss within the preprocessor is a bit of work.
  I looked around to try to get it done but it didn't seem important to
  spend time figuring this out.

  The component-library style import would only ever be from App.svelte
  and when the library is moved to a separate package, we wouldn't have to
  worry about aliases.
-->
<style global lang="scss">
  @import "component-library/styles.scss";
  @import "App.scss";
</style>
