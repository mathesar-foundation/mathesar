<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    faTimes,
    faPlus,
  } from '@fortawesome/free-solid-svg-icons';
  import type {
    GroupOption,
  } from '@mathesar/stores/tableData';
  import { Button, Select, Icon } from '@mathesar-components';
  import type { SelectOption } from '@mathesar-components/types';

  const dispatch = createEventDispatcher();

  export let options: SelectOption[];
  export let group: GroupOption;

  let groupColumns: SelectOption[];
  let groupColumnValue: SelectOption;
  let addNew = false;

  function calcNewGroupColumns(
    _columns: SelectOption[],
    _group: GroupOption,
  ) {
    let groupOptions = _columns;
    if (_group) {
      groupOptions = groupOptions.filter(
        (option) => !_group.has(option.id as string),
      );
    }
    groupColumns = groupOptions;
  }

  $: calcNewGroupColumns(options, group);

  function addGroupColumn() {
    if (groupColumnValue?.id) {
      const column = groupColumnValue.id as string;
      if (!group?.has(column)) {
        const newGroup = new Set(group);
        const resetPositions = newGroup.size === 0;
        newGroup.add(column);
        group = newGroup;
        dispatch('reload', { resetPositions });
        addNew = false;
      }
    }
  }

  function removeGroupColumn(column: string) {
    const newGroup = new Set(group);
    newGroup.delete(column);
    group = newGroup;
    const resetPositions = group.size === 0;
    dispatch('reload', { resetPositions });
  }
</script>

<section>
  <div class="header">
    <span>
      Group
      {#if group?.size > 0}
        ({group.size})
      {/if}
    </span>
  </div>
  <div class="content">
    <table>
      {#each [...(group ?? [])] as option (option)}
        <tr>
          <td class="groupcolumn">{option}</td>
          <td class="action">
            <Button on:click={() => removeGroupColumn(option)}>
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

      {#if groupColumns?.length > 0}
        {#if !addNew}
          <tr class="add-option">
            <td colspan="3">
              <Button on:click={() => { addNew = true; }}>
                Add new group column
              </Button>
            </td>
          </tr>

        {:else}
          <tr class="add-option">
            <td class="groupcolumn">
              <Select options={groupColumns} bind:value={groupColumnValue}/>
            </td>
            <td class="action">
              <Button size="small" on:click={addGroupColumn}>
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
