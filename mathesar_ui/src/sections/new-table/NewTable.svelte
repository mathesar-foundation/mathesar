<script lang="ts">
  import { TextInput } from '@mathesar-components';
  import { getFileStoreData, setFileStore } from '@mathesar/stores/fileImports';
  import type { Schema } from '@mathesar/App.d';

  import ImportFile from './import-file/ImportFile.svelte';

  export let schemaId: Schema['id'];
  export let id: unknown;
  $: identifier = id as string;

  let name = '';

  function onScopeChange(_schemaId: number, _id: string) {
    const fileImportData = getFileStoreData(_schemaId, _id);
    name = fileImportData.name;
  }

  function onNameChange(_name: string) {
    setFileStore(schemaId, identifier, {
      name: _name,
    });
  }

  $: onScopeChange(schemaId, identifier);
  $: onNameChange(name);
</script>

<div class="new-table-view">
  <div class="title">
    <TextInput bind:value={name}/>
  </div>

  <ImportFile {schemaId} id={identifier}/>
</div>

<style global lang="scss">
  @import 'NewTable.scss';
</style>
