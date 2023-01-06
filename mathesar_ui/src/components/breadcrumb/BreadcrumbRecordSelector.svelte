<script lang="ts">
  import { Button, iconSearch, Icon } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import { iconExpandRight } from '@mathesar/icons';
  import { getRecordSelectorFromContext } from '@mathesar/systems/record-selector/RecordSelectorController';

  const recordSelector = getRecordSelectorFromContext();
  export let table: TableEntry;

  function handleClick() {
    recordSelector.navigateToRecordPage({ tableId: table.id });
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
    border: 1px solid var(--slate-400);
    color: var(--slate-300);
    border-radius: var(--border-radius-m);
    display: flex;
    align-items: center;
    padding: 0.25rem;
    display: flex;
    align-items: center;

    :global(.expand-right-icon) {
      color: var(--slate-500);
    }

    &:hover,
    &:active {
      background-color: var(--slate-100);
      color: var(--slate-500);
      border-color: var(--slate-300);
    }
  }
</style>
