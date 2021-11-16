<script lang="ts">
  import {
    faTimes,
    faPlus,
  } from '@fortawesome/free-solid-svg-icons';
  import type { Meta, GroupOption } from '@mathesar/stores/table-data/types';
  import { Button, Select, Icon } from '@mathesar-component-library';
  import type { SelectOption } from '@mathesar-component-library/types';

  export let meta: Meta;
  export let options: SelectOption<string>[];

  $: ({ group } = meta);

  let groupColumns: SelectOption<string>[];
  let groupColumnValue: SelectOption<string>;
  let addNew = false;

  function calcNewGroupColumns(
    _columns: SelectOption<string>[],
    _group: GroupOption,
  ) {
    let groupOptions = _columns;
    if (_group) {
      groupOptions = groupOptions.filter(
        (option) => !_group.has(option.id),
      );
    }
    groupColumns = groupOptions;
  }

  $: calcNewGroupColumns(options, $group);

  function addGroupColumn() {
    if (groupColumnValue?.id) {
      const column = groupColumnValue.id;
      meta.addGroup(column);
      addNew = false;
    }
  }
</script>

<div class="display-option">
  <div class="header">
    <span>
      Group
      {#if $group?.size > 0}
        ({$group.size})
      {/if}
    </span>
  </div>
  <div class="content">
    <table>
      {#each Array.from($group ?? []) as option (option)}
        <tr>
          <td class="groupcolumn">{option}</td>
          <td class="action">
            <Button on:click={() => meta.removeGroup(option)}>
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
</div>

<style global lang="scss">
  @import "DisplayOption.scss";
</style>
