<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import { Icon } from '@mathesar/component-library';
  import { iconSelectRecord } from '@mathesar/icons';
  import { getRecordSelectorFromContext } from './RecordSelectorController';

  const recordSelector = getRecordSelectorFromContext();
  const dispatch = createEventDispatcher();

  export let table: { id: TableEntry['id']; name?: TableEntry['name'] };

  $: ({ id, name } = table);
  $: label = name
    ? $_('navigate_to_table_record', { values: { tableName: name } })
    : $_('navigate_to_record');

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
