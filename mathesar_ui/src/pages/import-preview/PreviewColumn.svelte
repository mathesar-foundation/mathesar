<script lang="ts">
  import { Dropdown, TextInput, Checkbox } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import { AbstractTypeControl } from '@mathesar/components/abstract-type-control';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';

  export let processedColumn: {
    column: Column;
    abstractType: AbstractType;
  };
  export let selected: boolean;
  export let displayName: string;

  // TODO: Also validate with other column names
  function checkAndSetNameIfEmpty() {
    if (displayName.trim() === '') {
      displayName = processedColumn.column.name;
    }
  }
</script>

<div class="column">
  <div class="column-name">
    <Checkbox
      bind:checked={selected}
      disabled={processedColumn.column.primary_key}
    />
    <TextInput bind:value={displayName} on:blur={checkAndSetNameIfEmpty} />
  </div>
  <Dropdown triggerClass="column-type" triggerAppearance="plain">
    <NameWithIcon slot="trigger" icon={processedColumn.abstractType.icon}>
      {processedColumn.abstractType.name}
    </NameWithIcon>
    <AbstractTypeControl
      slot="content"
      column={{
        ...processedColumn.column,
        abstractType: processedColumn.abstractType,
      }}
    />
  </Dropdown>
</div>

<style lang="scss">
  .column {
    flex-grow: 1;

    > :global(.column-type) {
      height: 2.2rem;
      width: 100%;
    }

    > .column-name {
      height: 3rem;
      padding: 0.35rem 0.6rem;
      display: flex;
      align-items: center;
      border-bottom: 1px solid var(--color-gray-light);

      :global(.checkbox) {
        flex-grow: 0;
        flex-shrink: 0;
        margin-right: 0.5rem;
      }
    }
  }
</style>
