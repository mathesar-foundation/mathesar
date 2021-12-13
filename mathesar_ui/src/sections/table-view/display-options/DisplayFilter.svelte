<script lang="ts">
  import { get } from 'svelte/store';
  import {
    faTimes,
    faPlus,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    Icon,
    Button,
    Select,
    TextInput,
  } from '@mathesar-component-library';
  import { filterCombinations } from '@mathesar/stores/table-data';
  import type { Meta, FilterCombination } from '@mathesar/stores/table-data/types';
  import type { SelectOption } from '@mathesar-component-library/types';
  import FilterEntry from './FilterEntry.svelte';

  export let meta: Meta;
  export let options: SelectOption[];

  let filter: Meta['filter'];
  let filterCombination: FilterCombination;
  let filterColumn: SelectOption;
  let filterCondition: SelectOption;
  let filterValue = '';
  let addNew = false;

  function onMetaChange(_meta: Meta) {
    ({ filter } = _meta);
    filterCombination = _meta.getFilterCombination();
  }

  $: onMetaChange(meta);

  const conditions = [
    { id: 'eq', label: 'equals' },
    { id: 'ne', label: 'not equals' },
  ];

  function addFilter() {
    meta.addFilter({
      column: filterColumn,
      condition: filterCondition,
      value: filterValue,
    });
  
    [filterColumn] = options;
    [filterCondition] = conditions;
    filterValue = '';
    addNew = false;
  }

  function updateFilters() {
    // Recreate with new object to trigger subscriptions
    meta.setFilters({
      ...get(filter),
    });
  }
</script>

<div class="display-option">
  <div class="header">
    <span>
      Filters
      {#if $filter?.filters?.length > 0}
        ({$filter?.filters?.length})
      {/if}
    </span>
  </div>
  <div class="content">
    <table>
      {#if $filter?.filters?.length > 0}
        <tr>
          <td>
            <Select options={filterCombinations} bind:value={filterCombination}
              on:change={() => meta.setFilterCombination(filterCombination)}/>
          </td>
        </tr>
      {/if}
      {#each $filter?.filters || [] as option, index (option)}
        <FilterEntry {options} {conditions}
          bind:column={option.column}
          bind:condition={option.condition}
          bind:value={option.value}
          on:removeFilter={() => meta.removeFilter(index)}
          on:reload={() => updateFilters()}/>
      {:else}
        <tr>
          <td class="empty-msg" colspan="3">
            No filters added
          </td>
        </tr>
      {/each}

      {#if options.length > 0}
        {#if !addNew}
          <tr class="add-option">
            <td colspan="3">
              <Button on:click={() => { addNew = true; }}>
                Add new filter
              </Button>
            </td>
          </tr>

        {:else}
          <tr class="add-option">
            <td class="column">
              <Select {options} bind:value={filterColumn}/>
            </td>
            <td class="dir">
              <Select options={conditions} bind:value={filterCondition}/>
            </td>
            <td class="value" colspan="2">
              <TextInput bind:value={filterValue}/>
            </td>
          </tr>
          <tr>
            <td class="filter-action" colspan="4">
              <Button size="small" on:click={addFilter}>
                <Icon data={faPlus}/>
              </Button>
              <Button size="small" on:click={() => { addNew = false; }}>
                <Icon data={faTimes}/>
              </Button>
            </td>
          </tr>
        {/if}
      {/if}
    </table>
  </div>
</div>

<style global lang="scss">
  @import "DisplayOption.scss";
</style>
