<script lang="ts">
  import { createEventDispatcher } from 'svelte';

  import type { TableEntry } from '@mathesar/api/tables';
  import { Icon } from '@mathesar/component-library';
  import { iconSelectRecord } from '@mathesar/icons';
  import { getRecordSelectorFromContext } from './RecordSelectorController';

  const recordSelector = getRecordSelectorFromContext();
  const dispatch = createEventDispatcher();

  export let table: { id: TableEntry['id']; name?: TableEntry['name'] };

  $: ({ id, name } = table);
  $: label = `Navigate to one ${name ? `${name} ` : ''}record`;

  function handleClick() {
    recordSelector.navigateToRecordPage({ tableId: id });
    dispatch('click');
  }
</script>

<button
  class="record-selector-navigation-button passthrough"
  aria-label={label}
  title={label}
  on:click={handleClick}
>
  <Icon {...iconSelectRecord} />
</button>

<style>
  .record-selector-navigation-button {
    color: var(--color-gray-dark);
    cursor: pointer;
    display: inline-flex;
    align-items: center;
    justify-content: center;
  }
  .record-selector-navigation-button:hover {
    color: black;
  }
</style>
