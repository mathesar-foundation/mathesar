<script lang="ts">
  import Cookies from 'js-cookie';
  import { schemas, reloadSchemas } from '@mathesar/stores/schemas';
  import { getFileStore } from '@mathesar/stores/fileImports';
  import type { FileImport } from '@mathesar/stores/fileImports';

  export let id: string = null;
  export let database: string = null;

  let fileImportData: FileImport;
  $: fileImportData = getFileStore(database, id);

  function submitListener(form: Node) {
    function onSubmit(e: Event) {
      e.preventDefault();
      const formData = new FormData(this);
      formData.append('database_key', database);

      fetch('/', { method: 'post', body: formData, headers: { 'X-CSRFToken': Cookies.get('csrftoken') } }).then((res) => {
        // eslint-disable-next-line no-void
        void reloadSchemas();
        return res;
      }).catch((err) => {
        // eslint-disable-next-line no-console
        console.log(err);
      });
    }

    form.addEventListener('submit', onSubmit);

    return {
      destroy() {
        form.removeEventListener('submit', onSubmit);
      },
    };
  }
</script>

<div class="import-file-view">
  Upload a CSV file to create a table.

  <form enctype="multipart/form-data" use:submitListener>
    <label for="id_table_name">Table name:</label>
    <input type="text" name="table_name" minlength="1" required id="id_table_name"
           bind:value={$fileImportData.name}>

    <label for="id_schema_name">Schema name:</label>
    <input type="text" name="schema_name" minlength="1" required id="id_schema_name"
           list="id_schema_name_data_list" bind:value={$fileImportData.schema}>
    <datalist id="id_schema_name_data_list">
      {#each $schemas.data as schema (schema.name)}
        <option value={schema.name}/>
      {/each}
    </datalist>

    <label for="id_file">CSV File:</label>
    <input type="file" name="file" required id="id_file">

    <button type="submit">Submit</button>
  </form>
</div>

<style global lang="scss">
  @import 'ImportFile.scss';
</style>
