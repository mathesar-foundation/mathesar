<script lang="ts">
  import { Route } from 'tinro';
  import { ToastPresenter, Confirmation } from '@mathesar-component-library';
  import Header from '@mathesar/header/Header.svelte';
  import { toast } from '@mathesar/stores/toast';
  import { setNewRecordSelectorControllerInContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import { confirmationController } from '@mathesar/stores/confirmation';
  import { getTableName } from '@mathesar/stores/tables';
  import { currentSchemaId } from '@mathesar/stores/schemas';
  import { beginUpdatingUrlWhenSchemaChanges } from './utils/routing';
  import { modal } from './stores/modal';
  import RecordSelectorModal from './systems/record-selector/RecordSelectorModal.svelte';
  // Routes
  import SchemaHome from './routes/schema-home/SchemaHome.svelte';
  import SchemaListing from './routes/schema-listing/SchemaListing.svelte';

  // Why is this function called at such a high level, and not handled closer to
  // the code point related to saving tab data or the code point related to
  // switching schemas?
  //
  // Because we need to place this at a high level in order to avoid circular
  // imports.
  beginUpdatingUrlWhenSchemaChanges(currentSchemaId);

  const recordSelectorController = setNewRecordSelectorControllerInContext({
    modal: modal.spawnModalController(),
    getTableName,
  });
</script>

<ToastPresenter entries={toast.entries} />
<Confirmation controller={confirmationController} />
<RecordSelectorModal controller={recordSelectorController} />

<Header />

<section class="content-section">
  <Route path="/*" firstmatch>
    <Route path="/:db/schemas" let:meta>
      <SchemaListing database={meta.params.db} />
    </Route>
    <Route path="/:db/:schema/*" let:meta firstmatch>
      <SchemaHome
        database={meta.params.db}
        schemaId={parseInt(meta.params.schema, 10)}
      />
    </Route>
    <Route path="/:db" redirect="/:db/schemas" />
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
  @import 'component-library/styles.scss';
  @import 'App.scss';
</style>
