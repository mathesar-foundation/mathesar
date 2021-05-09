<style global lang="scss">
  @import './Tables.scss';
</style>

<script>
  import { onDestroy } from 'svelte';
  import { meta } from 'tinro';
  import { setSelectedTable, tables, records } from '@mathesar/api/tables';
  
  const route = meta();
  $: setSelectedTable($route.params?.id);

  onDestroy(() => {
    setSelectedTable(null);
  });
</script>

{#if $tables.state === 'done'}
  <h2>{$tables.data.name || ''}</h2>

  <table>
    <thead>
      <tr>
        {#each ($tables.data.columns || []) as column (column.name)}
          <th>{column.name}</th>
        {/each}
      </tr>
    </thead>
    {#if $records.state === 'done'}
      <tbody>
        {#each ($records.data.results || []) as row (row.mathesar_id)}
          <tr>
            {#each ($tables.data.columns || []) as column (column.name)}
              <td>{row[column.name]}</td>
            {/each}
          </tr>
        {/each}
      </tbody>
    {/if}
  </table>

{:else if $tables.state === 'loading'}
  loading

{:else if $tables.state === 'error'}
  There was an error loading data
{/if}
