<script lang="ts">
  import { iconExpandRight } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import { Button, Icon, iconSearch } from '@mathesar-component-library';

  const recordSelector = getRecordSelectorFromContext();
  export let table: Table;

  function handleClick() {
    recordSelector.navigateToRecordPage({ tableId: table.oid });
  }
</script>

<Button on:click={handleClick} appearance="ghost" class="padding-zero">
  <span class="trigger">
    <Icon {...iconSearch} />
    <Icon {...iconExpandRight} class="expand-right-icon" />
  </span>
</Button>

<style lang="scss">
  .trigger {
    border: 1px solid var(--gray-400);
    color: var(--gray-300);
    border-radius: var(--border-radius-m);
    display: flex;
    align-items: center;
    padding: 0.25rem;
    display: flex;
    align-items: center;

    :global(.expand-right-icon) {
      color: var(--gray-500);
    }

    &:hover,
    &:active {
      background-color: var(--gray-100);
      color: var(--gray-500);
      border-color: var(--gray-300);
    }
  }
</style>
