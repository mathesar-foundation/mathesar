<script lang="ts">
  import { tick } from 'svelte';
  import { _ } from 'svelte-i18n';

  import type { Column } from '@mathesar/api/rpc/columns';
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { iconAddFilter } from '@mathesar/icons';
  import {
    ButtonMenuItem,
    DropdownMenu,
    Icon,
    iconClose,
  } from '@mathesar-component-library';

  import type RowSeekerController from './RowSeekerController';

  export let columnsArray: Column[];
  export let controller: RowSeekerController;

  let filterSearch: HTMLElement;
  let value = '';

  $: ({ unappliedFilterColumn } = controller);

  async function cancel() {
    value = '';
    unappliedFilterColumn.set(undefined);
    await controller.focusSearch();
  }

  async function addFilter(column: Column) {
    controller.newUnappliedFilter(column);
    await tick();
    filterSearch?.focus();
  }

  async function keydown(e: KeyboardEvent) {
    if (e.key === 'Enter' && value) {
      if ($unappliedFilterColumn) {
        await controller.addToFilter($unappliedFilterColumn.id, value);
      }
      await cancel();
    } else if (e.key === 'Escape') {
      await cancel();
    }
  }
</script>

<div class="drilldown" class:filter-being-added={$unappliedFilterColumn}>
  <DropdownMenu triggerAppearance="plain">
    <svelte:fragment slot="trigger">
      {#if $unappliedFilterColumn}
        <ColumnName column={$unappliedFilterColumn} />
      {:else}
        <Icon {...iconAddFilter} />
      {/if}
    </svelte:fragment>
    {#each [...columnsArray.values()] as column (column.id)}
      <ButtonMenuItem on:click={() => addFilter(column)}>
        <ColumnName {column} />
      </ButtonMenuItem>
    {/each}
  </DropdownMenu>
  {#if $unappliedFilterColumn}
    <input
      bind:this={filterSearch}
      bind:value
      type="text"
      class="input-element"
      placeholder={$_('enter value')}
      on:keydown={keydown}
    />
    <div class="close" on:click={cancel}>
      <Icon {...iconClose} />
    </div>
  {/if}
</div>

<style lang="scss">
  .drilldown {
    color: var(--gray-500);
    font-size: var(--sm1);
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--sm3);
    --button-padding: var(--sm6) var(--sm4);
  }

  .filter-being-added {
    border: 1px solid var(--accent-700);
    border-radius: var(--sm5);

    :global(.dropdown.trigger .label) {
      max-width: 4rem;
    }
  }

  .close {
    cursor: pointer;
  }

  input.input-element {
    border: none;
    box-shadow: none;
    padding: 0;
    background: inherit;
    max-width: 5rem;
  }
</style>
