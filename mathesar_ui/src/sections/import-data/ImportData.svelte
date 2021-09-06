<script lang="ts">
  import { getFileStore, Stages } from '@mathesar/stores/fileImports';
  import type { FileImport } from '@mathesar/stores/fileImports';
  import {
    Notification,
  } from '@mathesar-components';
  import type { Database, SchemaEntry } from '@mathesar/App.d';

  import Preview from './preview/Preview.svelte';
  import Upload from './upload/Upload.svelte';
  import {
    clearErrors,
  } from './importUtils';

  export let id: unknown = null;
  export let database: Database['name'];
  export let schemaId: SchemaEntry['id'];
  $: identifier = id as string;

  let fileImportStore: FileImport;
  $: fileImportStore = getFileStore(database, schemaId, identifier);
</script>

<div class="import-file-view">
  <Notification type="danger" show={!!$fileImportStore.error}
                on:close={() => clearErrors(fileImportStore)}>
    There was an error when trying to import file. Please try again.
    <svelte:fragment slot="description">
      {$fileImportStore.error}
    </svelte:fragment>
  </Notification>

  {#if $fileImportStore.stage === Stages.UPLOAD}
    <Upload {fileImportStore}/>

  {:else if $fileImportStore.stage === Stages.PREVIEW}
    <Preview {fileImportStore}/>
  {/if}
</div>

<style global lang="scss">
  @import 'ImportData.scss';
</style>
