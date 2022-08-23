<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
  import type { Grouping } from '@mathesar/stores/table-data';
  import { Button, Icon } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import SelectColumn from '@mathesar/components/SelectColumn.svelte';

  export let grouping: Writable<Grouping>;
  export let columns: Column[];

  /** Columns which are not already used as a grouping entry */
  $: availableColumns = columns.filter((column) => !$grouping.has(column.id));
  $: [newGroupColumn] = availableColumns;
  let addNew = false;

  function addGroupColumn() {
    grouping.update((g) => g.with(newGroupColumn.id));
    addNew = false;
  }
</script>

<div class="display-option">
  <div class="header">
    <span>
      Group
      {#if $grouping.size > 0}
        ({$grouping.size})
      {/if}
    </span>
  </div>
  <div class="content">
    <table>
      {#each [...$grouping] as columnId (columnId)}
        <tr>
          <td class="groupcolumn">
            {columns.find((c) => c.id === columnId)?.name}
          </td>
          <td class="action">
            <Button
              on:click={() => grouping.update((g) => g.without(columnId))}
            >
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
                Add new group column
              </Button>
            </td>
          </tr>
        {:else}
          <tr class="add-option">
            <td class="groupcolumn">
              <SelectColumn
                columns={availableColumns}
                bind:column={newGroupColumn}
              />
            </td>
            <td class="action">
              <Button size="small" on:click={addGroupColumn}>
                <Icon data={faPlus} />
              </Button>
              <Button
                size="small"
                on:click={() => {
                  addNew = false;
                }}
              >
                <Icon data={faTimes} />
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
