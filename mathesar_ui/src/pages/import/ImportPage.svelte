<script lang="ts">
  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { getFileStore, Stages } from '@mathesar/stores/fileImports';
  import { Notification } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import Preview from './preview/Preview.svelte';
  import Upload from './upload/Upload.svelte';
  import { clearErrors } from './importUtils';

  export let database: Database;
  export let schema: SchemaEntry;

  $: fileImportStore = getFileStore(database.name, schema.id);
  $: stepNumber = $fileImportStore.stage === Stages.UPLOAD ? 1 : 2;
</script>

<!--
  TODO

  Eliminate nested vertical scroll bars on the import preview page by passing
  the `fitViewport` option to `LayoutWithHeader` and adjusting the CSS within
  the import content as necessary.
-->
<LayoutWithHeader>
  <div class="import-file-view">
    <Notification
      type="danger"
      show={!!$fileImportStore.error}
      on:close={() => clearErrors(fileImportStore)}
    >
      There was an error when trying to import file. Please try again.
      <svelte:fragment slot="description">
        {$fileImportStore.error}
      </svelte:fragment>
    </Notification>

    <div>Add Table (Step {stepNumber} of 2)</div>

    {#if $fileImportStore.stage === Stages.UPLOAD}
      <Upload {fileImportStore} />
    {:else if $fileImportStore.stage === Stages.PREVIEW}
      <Preview {database} {schema} {fileImportStore} />
    {/if}
  </div>
</LayoutWithHeader>
