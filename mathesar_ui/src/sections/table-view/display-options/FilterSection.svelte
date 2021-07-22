<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    faTimes,
    faPlus,
  } from '@fortawesome/free-solid-svg-icons';
  import {
    Icon,
    Button,
    Select,
    TextInput,
  } from '@mathesar-components';
  import type {
    FilterOption,
  } from '@mathesar/stores/tableData';
  import type { SelectOption } from '@mathesar-components/types';
  import FilterEntry from './FilterEntry.svelte';

  const dispatch = createEventDispatcher();

  export let options: SelectOption[];
  export let filter: FilterOption;

  let filterCombination: SelectOption;
  let filterColumn: SelectOption;
  let filterCondition: SelectOption;
  let filterValue = '';
  let addNew = false;

  const combinations = [
    { id: 'and', label: 'AND' },
    { id: 'or', label: 'OR' },
  ];

  const conditions = [
    { id: 'eq', label: 'equals' },
    { id: 'ne', label: 'not equals' },
  ];

  onMount(() => {
    filterCombination = filter?.combination ?? combinations[0];
  });

  function addFilter() {
    filter = {
      combination: filterCombination || filter?.combination || combinations[0],
      filters: [
        ...(filter?.filters || []),
        {
          column: filterColumn,
          condition: filterCondition,
          value: filterValue,
        },
      ],
    };
    [filterColumn] = options;
    [filterCondition] = conditions;
    filterValue = '';
    dispatch('reload');
    addNew = false;
  }

  function removeFilter(index: number) {
    filter?.filters?.splice(index, 1);
    filter = { ...filter };
    dispatch('reload');
  }

  function setFilterCombination() {
    filter = {
      ...filter,
      combination: filterCombination,
    };
    dispatch('reload');
  }
</script>

<section>
  <div class="header">
    <span>
      Filters
      {#if filter?.filters?.length > 0}
        ({filter?.filters?.length})
      {/if}
    </span>
  </div>
  <div class="content">
    <table>
      {#if filter?.filters?.length > 0}
        <tr>
          <td>
            <Select options={combinations} bind:value={filterCombination}
              on:change={setFilterCombination}/>
          </td>
        </tr>
      {/if}
      {#each filter?.filters || [] as option, index (option)}
        <FilterEntry {options} {conditions}
          bind:column={option.column}
          bind:condition={option.condition}
          bind:value={option.value}
          on:removeFilter={() => removeFilter(index)}
          on:reload={() => dispatch('reload')}/>
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
</section>
