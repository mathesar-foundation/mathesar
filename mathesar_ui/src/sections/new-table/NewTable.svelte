<script lang="ts">
  import { TextInput } from '@mathesar-components';
  import ImportFile from './import-file/ImportFile.svelte';

  export let database: string;
  export let id: unknown;
  $: identifier = id as string;

  let name = '';
</script>

<div class="new-table-view">
  <div class="title">
    <TextInput bind:value={name}/>
  </div>

  <ImportFile {database} id={identifier} on:importComplete/>
</div>

<style global lang="scss">
  @import 'NewTable.scss';
</style>
