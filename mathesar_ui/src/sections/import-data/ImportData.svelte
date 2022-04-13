<script lang="ts">
  import { getFileStore, Stages } from '@mathesar/stores/fileImports';
  import { Notification } from '@mathesar-component-library';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import Preview from './preview/Preview.svelte';
  import Upload from './upload/Upload.svelte';
  import { clearErrors } from './importUtils';

  export let id: string | undefined = undefined;
  export let database: Database['name'];
  export let schemaId: SchemaEntry['id'];

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  $: fileImportStore = getFileStore(database, schemaId, id);
  $: stepNumber = $fileImportStore.stage === Stages.UPLOAD ? 1 : 2;
</script>

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
    <Preview {fileImportStore} />
  {/if}
</div>

<style global lang="scss">
  @import 'ImportData.scss';
</style>
