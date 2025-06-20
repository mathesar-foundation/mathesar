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
    <span class="icon"><Icon {...iconSearch} /></span>
    <Icon {...iconExpandRight} class="expand-right-icon" />
  </span>
</Button>

<style lang="scss">
  .trigger {
    color: var(--text-secondary);
    border-radius: var(--border-radius-m);
    display: flex;
    align-items: center;
    padding: 0.25rem;
    display: flex;
    align-items: center;

    .icon {
      font-size: 90%;
    }

    :global(.expand-right-icon) {
      color: var(--text-navigation);
    }

    &:hover,
    &:active {
      background-color: var(--surface-elevated-low-active);
      color: var(--text-navigation-active);
      border-color: var(--border-elevated-low);
    }
  }
</style>
