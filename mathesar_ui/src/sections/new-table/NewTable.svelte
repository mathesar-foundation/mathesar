<script lang="ts">
  import { TextInput } from '@mathesar-components';
  import { getFileStoreData, setFileStore } from '@mathesar/stores/fileImports';
  import ImportFile from './import-file/ImportFile.svelte';

  export let database: string;
  export let id: unknown;
  $: identifier = id as string;

  let name = '';

  function onScopeChange(_db: string, _id: string) {
    const fileImportData = getFileStoreData(_db, _id);
    name = fileImportData.name;
  }

  function onNameChange(_name: string) {
    setFileStore(database, identifier, {
      name: _name,
    });
  }

  $: onScopeChange(database, identifier);
  $: onNameChange(name);
</script>

<div class="new-table-view">
  <div class="title">
    <TextInput bind:value={name}/>
  </div>

  <ImportFile {database} id={identifier}/>
</div>

<style global lang="scss">
  @import 'NewTable.scss';
</style>
