
<style global lang="scss">
  @import './Index.scss';
</style>

<script>
  import Cookies from 'js-cookie';
  import { schemas, reloadSchemas } from '@mathesar/api/schemas';

  export let database = null;

  function submitListener(form) {
    function onSubmit(e) {
      e.preventDefault();
      const formData = new FormData(this);
      formData.append('database_key', database);

      fetch('/', { method: 'post', body: formData, headers: { 'X-CSRFToken': Cookies.get('csrftoken') } }).then((res) => {
        reloadSchemas();
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

<div class="index-view">
  Upload a CSV file to create a table.

  <form enctype="multipart/form-data" use:submitListener>
    <label for="id_table_name">Table name:</label>
    <input type="text" name="table_name" minlength="1" required id="id_table_name">

    <label for="id_schema_name">Schema name:</label>
    <input type="text" name="schema_name" minlength="1" required id="id_schema_name" list="id_schema_name_data_list">
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
