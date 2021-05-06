<style lang="scss">
  @import './index.scss';
</style>

<script>
  import Cookies from 'js-cookie';

  export let schemas = [];
  export let databases = [];

  function submitListener(form) {
    function onSubmit(e) {
      e.preventDefault();
      const formData = new FormData(this);

      fetch('/', { method: 'post', body: formData, headers: { 'X-CSRFToken': Cookies.get('csrftoken') } }).then((res) => {
        console.log(res);
        return res;
      }).catch((err) => {
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

<svelte:head>
  <title>Mathesar - Home</title>
</svelte:head>

<h2>Welcome to Mathesar!</h2>
<div class="index-view">
  <h5>Create a Table</h5>
  <p>Upload a CSV file to create a table.</p>

  <form enctype="multipart/form-data" use:submitListener>
    <label for="id_table_name">Table name:</label>
    <input type="text" name="table_name" minlength="1" required id="id_table_name">

    <label for="id_schema_name">Schema name:</label>
    <input type="text" name="schema_name" minlength="1" required id="id_schema_name" list="id_schema_name_data_list">
    <datalist id="id_schema_name_data_list">
      {#each schemas as schema (schema.name)}
        <option value={schema.name}/>
      {/each}
    </datalist>

    <label for="id_database_key">Database:</label>
    <select name="database_key" id="id_database_key">
      {#each databases as database (database)}
        <option value={database}>{database}</option>
      {/each}
    </select>

    <label for="id_file">CSV File:</label>
    <input type="file" name="file" required id="id_file">

    <button type="submit">Submit</button>
  </form>

  {#if schemas?.length > 0}
    <div>
      <h5>View Existing Tables</h5>
      <ul>
        {#each schemas as schema}
          <li>
            {schema.name}
            {#if schema.tables?.length > 0}
              <ul>
                {#each schema.tables as table}
                  <li>
                    <a href="/tables/{table.id}">
                      {table.name}
                    </a>
                  </li>
                {/each}
              </ul>
            {/if}
          </li>
        {/each}
      </ul>
    </div>
  {/if}
</div>
