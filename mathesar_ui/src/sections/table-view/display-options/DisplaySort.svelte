<script lang="ts">
  import {
    faTimes,
    faPlus,
  } from '@fortawesome/free-solid-svg-icons';
  import type { Meta, SortOption } from '@mathesar/stores/table-data/types';
  import { Icon, Button, Select } from '@mathesar-components';
  import type { SelectOption, SelectChangeEvent } from '@mathesar-components/types';

  export let meta: Meta;
  export let options: SelectOption<string>[];

  $: ({ sort } = meta);

  let sortColumns: SelectOption<string>[];
  let sortColumnValue: SelectOption<string>;
  let sortDirectionValue: SelectOption<'asc' | 'desc'>;
  let addNew = false;

  function calcNewSortColumns(
    _columns: SelectOption<string>[],
    _sort: SortOption,
  ) {
    let sortOptions = _columns;
    if (_sort) {
      sortOptions = sortOptions.filter(
        (option) => !_sort.get(option.id),
      );
    }
    sortColumns = sortOptions;
    [sortColumnValue] = sortColumns;
  }

  $: calcNewSortColumns(options, $sort);

  const sortDirections = [
    { id: 'asc', label: 'asc' },
    { id: 'desc', label: 'desc' },
  ];

  function getSelectedDirection(
    option: [string, 'asc' | 'desc'],
  ) {
    return sortDirections.find((entry) => entry.id === option[1]);
  }

  function directionChanged(
    event: SelectChangeEvent<'asc' | 'desc'>,
    option: [string, 'asc' | 'desc'],
  ) {
    const newDirection = event.detail.value.id ?? 'asc';
    meta.changeSortDirection(option[0], newDirection);
  }

  function addSortColumn() {
    if (sortColumnValue?.id) {
      const column = sortColumnValue.id;
      meta.addUpdateSort(column, sortDirectionValue?.id);
      addNew = false;
    }
  }
</script>

<div>
  <div class="header">
    <span>
      Sort
      {#if $sort?.size > 0}
        ({$sort.size})
      {/if}
    </span>
  </div>
  <div class="content">
    <table>
      {#each Array.from($sort ?? []) as option (option[0])}
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
            <Button on:click={() => meta.removeSort(option[0])}>
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
</div>
