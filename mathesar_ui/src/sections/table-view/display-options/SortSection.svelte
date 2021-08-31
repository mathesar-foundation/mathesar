<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faTimes,
    faPlus,
  } from '@fortawesome/free-solid-svg-icons';
  import type {
    SortOption,
  } from '@mathesar/stores/tableData';
  import { Icon, Button, Select } from '@mathesar-components';
  import type { SelectOption, SelectChangeEvent } from '@mathesar-components/types';

  const dispatch = createEventDispatcher();

  export let options: SelectOption[];
  export let sort: SortOption;

  let sortColumns: SelectOption[];
  let sortColumnValue: SelectOption;
  let sortDirectionValue: SelectOption;
  let addNew = false;

  function calcNewSortColumns(
    _columns: SelectOption[],
    _sort: SortOption,
  ) {
    let sortOptions = _columns;
    if (_sort) {
      sortOptions = sortOptions.filter(
        (option) => !_sort.get(option.id as string),
      );
    }
    sortColumns = sortOptions;
    [sortColumnValue] = sortColumns;
  }

  $: calcNewSortColumns(options, sort);

  const sortDirections = [
    { id: 'asc', label: 'asc' },
    { id: 'desc', label: 'desc' },
    { id: 'desc1', label: 'desc1' },
    { id: 'desc22', label: 'desc2' },
    { id: 'desc2', label: 'desc3' },
    { id: 'desc3', label: 'desc4' },
    { id: 'desc4', label: 'desc5' },
    { id: 'desc5', label: 'desc6' },
    { id: 'desc6', label: 'desc7' },
    { id: 'desc7', label: 'desc81' },
    { id: 'desc8', label: 'desc8' },
    { id: 'desc9', label: 'desc9'},
  ];

  function getSelectedDirection(
    option: [string, 'asc' | 'desc'],
  ) {
    return sortDirections.find((entry) => entry.id === option[1]);
  }

  function directionChanged(
    event: SelectChangeEvent,
    option: [string, 'asc' | 'desc'],
  ) {
    const newDirection = event.detail.value.id as 'asc' | 'desc';
    if (newDirection && sort?.get(option[0]) !== newDirection) {
      const newSort = new Map(sort);
      newSort.set(option[0], newDirection);
      sort = newSort;
      dispatch('reload');
    }
  }

  function addSortColumn() {
    if (sortColumnValue?.id) {
      const column = sortColumnValue.id as string;
      if (!sort?.get(column)) {
        const direction = sortDirectionValue?.id as 'asc' | 'desc' || 'asc';
        const newSort: SortOption = new Map(sort);
        newSort.set(column, direction);
        sort = newSort;
        dispatch('reload');
        addNew = false;
      }
    }
  }

  function removeSortColumn(option: [string, 'asc' | 'desc']) {
    const newSort = new Map(sort);
    newSort.delete(option[0]);
    sort = newSort;
    dispatch('reload');
  }
</script>

<section>
  <div class="header">
    <span>
      Sort
      {#if sort?.size > 0}
        ({sort.size})
      {/if}
    </span>
  </div>
  <div class="content">
    <table>
      {#each [...(sort ?? [])] as option (option[0])}
        <tr>
          <td class="column">{option[0]}</td>
          <td class="dir">
            <Select options={sortDirections}
              value={getSelectedDirection(option)}
              on:change={
                (event) => directionChanged(event, option)
              }/>
          </td>
          <td class="action">
            <Button on:click={() => removeSortColumn(option)}>
              Clear
            </Button>
          </td>
        </tr>
      {:else}
        <tr>
          <td class="empty-msg" colspan="3">
            No column selected
          </td>
        </tr>
      {/each}

      {#if sortColumns?.length > 0}
        {#if !addNew}
          <tr class="add-option">
            <td colspan="3">
              <Button on:click={() => { addNew = true; }}>
                Add new sort column
              </Button>
            </td>
          </tr>

        {:else}
          <tr class="add-option">
            <td class="column">
              <Select options={sortColumns} bind:value={sortColumnValue}/>
            </td>
            <td class="dir">
              <Select options={sortDirections} bind:value={sortDirectionValue}/>
            </td>
            <td class="action">
              <Button size="small" on:click={addSortColumn}>
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
