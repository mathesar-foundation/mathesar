<script lang="ts">
  import type { Writable } from 'svelte/store';
  // import { iconTimes, iconPlus } from '@mathesar/icons';
  // import { Icon, Button, Select, TextInput } from '@mathesar-component-library';
  // import {
  //   filterCombinations,
  //   filterConditions,
  //   defaultFilterCondition,
  //   defaultFilterCombination,
  // } from '@mathesar/stores/table-data';
  import type {
    Filtering,
    Column,
    // FilterCondition,
    // FilterCombination,
  } from '@mathesar/stores/table-data/types';
  // import FilterEntry from './FilterEntry.svelte';

  export let filtering: Writable<Filtering>;
  export let columns: Column[];

  // let filterCombination: FilterCombination = defaultFilterCombination;
  // let filterColumn: ColumnSelectOption = columnSelectOptions[0];
  // let filterCondition: FilterCondition | undefined;
  // let filterValue = '';
  // let addNew = false;

  // function addFilter() {
  //   if (!filterColumn) {
  //     return;
  //   }
  //   filtering.update((f) =>
  //     f.withEntry({
  //       columnName: filterColumn.columnName,
  //       condition: filterCondition ?? defaultFilterCondition,
  //       value: filterValue,
  //     }),
  //   );

  //   filterColumn = columnSelectOptions[0];
  //   filterCondition = filterConditions[0];
  //   filterValue = '';
  //   addNew = false;
  // }

  // function removeFilter(index: number) {
  //   filtering.update((f) => f.withoutEntry(index));
  // }

  // function updateFilters() {
  //   // Recreate with new object to trigger subscriptions
  //   filtering.update((f) => f);
  // }
</script>

<div class="display-option">
  <!-- <div class="header">
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
        <FilterEntry
          {columnSelectOptions}
          conditions={filterConditions}
          filterByDuplicates={entry.condition.id === filterConditions[2].id}
          bind:column={entry.column}
          bind:condition={entry.condition}
          bind:value={entry.value}
          on:removeFilter={() => removeFilter(index)}
          on:reload={() => updateFilters()}
        />
      {:else}
        <tr>
          <td class="empty-msg" colspan="3"> No filters added </td>
        </tr>
      {/each}

      {#if columnSelectOptions.length > 0}
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
          <tr class="add-option">
            <td class="column">
              <Select options={columnSelectOptions} bind:value={filterColumn} />
            </td>
            <td class="dir">
              <Select options={filterConditions} bind:value={filterCondition} />
            </td>
            {#if filterCondition !== filterConditions[2]}
              <td class="value" colspan="2">
                <TextInput bind:value={filterValue} />
              </td>
            {/if}
          </tr>
          <tr>
            <td class="filter-action" colspan="4">
              <Button size="small" on:click={addFilter}>
                <Icon {...iconPlus} />
              </Button>
              <Button
                size="small"
                on:click={() => {
                  addNew = false;
                }}
              >
                <Icon {...iconTimes} />
              </Button>
            </td>
          </tr>
        {/if}
      {/if}
    </table>
  </div> -->
</div>

<style global lang="scss">
  @import 'DisplayOption.scss';
</style>
