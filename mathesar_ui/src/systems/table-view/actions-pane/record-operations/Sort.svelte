<script lang="ts">
  // TODO: Improve UX

  import type { Writable } from 'svelte/store';
  import { Icon, Button } from '@mathesar-component-library';
  import { SortDirection } from '@mathesar/stores/table-data';
  import type { Sorting } from '@mathesar/stores/table-data';
  import type { Column } from '@mathesar/api/tables/columns';
  import SelectSortDirection from '@mathesar/components/SelectSortDirection.svelte';
  import SelectColumn from '@mathesar/components/SelectColumn.svelte';
  import { iconAddNew, iconDeleteMinor } from '@mathesar/icons';

  export let sorting: Writable<Sorting>;
  export let columns: Column[];

  /** Columns which are not already used as a sorting entry */
  $: availableColumns = columns.filter((column) => !$sorting.has(column.id));
  $: [newSortColumn] = availableColumns;
  let newSortDirection = SortDirection.A;
  let addNew = false;

  function addSortColumn() {
    sorting.update((s) => s.with(newSortColumn.id, newSortDirection));
    addNew = false;
  }
</script>

<div class="display-option">
  <div class="header">
    <span>
      Sort
      {#if $sorting.size > 0}
        ({$sorting.size})
      {/if}
    </span>
  </div>
  <div class="content">
    <table>
      {#each [...$sorting] as [columnId, sortDirection] (columnId)}
        <tr>
          <td class="column">{columns.find((c) => c.id === columnId)?.name}</td>
          <td class="dir">
            <SelectSortDirection
              value={sortDirection}
              onChange={(direction) => {
                sorting.update((s) => s.with(columnId, direction));
              }}
            />
          </td>
          <td class="action">
            <Button on:click={() => sorting.update((s) => s.without(columnId))}>
              Clear
            </Button>
          </td>
        </tr>
      {:else}
        <tr>
          <td class="empty-msg" colspan="3"> No column selected </td>
        </tr>
      {/each}

      {#if availableColumns.length > 0}
        {#if !addNew}
          <tr class="add-option">
            <td colspan="3">
              <Button
                on:click={() => {
                  addNew = true;
                }}
              >
                Add new sort column
              </Button>
            </td>
          </tr>
        {:else}
          <tr class="add-option">
            <td class="column">
              <SelectColumn
                columns={availableColumns}
                bind:column={newSortColumn}
              />
            </td>
            <td class="dir">
              <SelectSortDirection bind:value={newSortDirection} />
            </td>
            <td class="action">
              <Button size="small" on:click={addSortColumn}>
                <Icon {...iconAddNew} />
              </Button>
              <Button
                size="small"
                on:click={() => {
                  addNew = false;
                }}
              >
                <Icon {...iconDeleteMinor} />
              </Button>
            </td>
          </tr>
        {/if}
      {/if}
    </table>
  </div>
</div>

<style global lang="scss">
  @import 'DisplayOption.scss';
</style>
