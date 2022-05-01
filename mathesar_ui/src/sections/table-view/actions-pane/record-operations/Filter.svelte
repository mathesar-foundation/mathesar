<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { faTimes, faPlus } from '@fortawesome/free-solid-svg-icons';
  import { Icon, Button, Select } from '@mathesar-component-library';
  import {
    filterCombinations,
    defaultFilterCombination,
  } from '@mathesar/stores/table-data';
  import type { FilterCombination } from '@mathesar/api/tables/records';
  import type { FilterEntry } from '@mathesar/stores/table-data/types';
  import type { Filtering } from '@mathesar/stores/table-data/types';
  import FilterEntryComponent from './FilterEntry.svelte';
  import type { ProcessedTableColumnMap } from '../../utils';

  export let filtering: Writable<Filtering>;
  export let processedTableColumnsMap: ProcessedTableColumnMap;

  let filterCombination: FilterCombination = defaultFilterCombination;
  let newfilterColumnId: FilterEntry['columnId'] | undefined;
  let newfilterConditionId: FilterEntry['conditionId'] | undefined;
  let newfilterValue: FilterEntry['value'] = undefined;
  let addNew = false;

  function addFilter() {
    if (!newfilterColumnId || !newfilterConditionId) {
      return;
    }
    const newFilter = {
      columnId: newfilterColumnId,
      conditionId: newfilterConditionId,
      value: newfilterValue,
    };
    filtering.update((f) => f.withEntry(newFilter));

    newfilterColumnId = undefined;
    newfilterConditionId = undefined;
    newfilterValue = undefined;
    addNew = false;
  }

  function removeFilter(index: number) {
    filtering.update((f) => f.withoutEntry(index));
  }

  function updateFilters() {
    // Recreate with new object to trigger subscriptions
    filtering.update((f) => f);
  }
</script>

<div class="display-option">
  <div class="header">
    <span>
      Filters
      {#if $filtering.entries.length}
        ({$filtering.entries.length})
      {/if}
    </span>
  </div>
  <div class="content">
    <table>
      {#if $filtering?.entries.length}
        <tr>
          <td>
            <Select
              options={filterCombinations}
              bind:value={filterCombination}
              on:change={() =>
                filtering.update((f) => f.withCombination(filterCombination))}
            />
          </td>
        </tr>
      {/if}
      {#each $filtering.entries as entry, index (entry)}
        <FilterEntryComponent
          {processedTableColumnsMap}
          bind:columnId={entry.columnId}
          bind:conditionId={entry.conditionId}
          bind:value={entry.value}
          on:removeFilter={() => removeFilter(index)}
          on:reload={() => updateFilters()}
        />
      {:else}
        <tr>
          <td class="empty-msg" colspan="3"> No filters added </td>
        </tr>
      {/each}

      {#if processedTableColumnsMap.size}
        {#if !addNew}
          <tr class="add-option">
            <td colspan="3">
              <Button
                on:click={() => {
                  addNew = true;
                }}
              >
                Add new filter
              </Button>
            </td>
          </tr>
        {:else}
          <FilterEntryComponent
            {processedTableColumnsMap}
            allowRemoval={false}
            bind:columnId={newfilterColumnId}
            bind:conditionId={newfilterConditionId}
            bind:value={newfilterValue}
          />
          <tr>
            <td class="filter-action" colspan="4">
              <Button size="small" on:click={addFilter}>
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
