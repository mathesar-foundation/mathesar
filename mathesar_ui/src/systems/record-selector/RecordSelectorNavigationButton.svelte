<script lang="ts">
  import type { TableEntry } from '@mathesar/api/tables';
  import { Button, Icon } from '@mathesar/component-library';
  import { iconSelectRecord } from '@mathesar/icons';
  import { getRecordSelectorFromContext } from './RecordSelectorController';

  const recordSelector = getRecordSelectorFromContext();

  export let table: { id: TableEntry['id']; name?: TableEntry['name'] };

  $: ({ id, name } = table);
  $: label = `Navigate to one ${name ? `${name} ` : ''}record`;
</script>

<span class="record-selector-navigation-button">
  <Button
    appearance="ghost"
    class="padding-zero"
    aria-label={label}
    title={label}
    on:click={() => recordSelector.navigateToRecordPage({ tableId: id })}
  >
    <Icon {...iconSelectRecord} />
  </Button>
</span>

<style>
  .record-selector-navigation-button {
    color: var(--color-gray-dark);
  }
  .record-selector-navigation-button:hover {
    color: black;
  }
</style>
