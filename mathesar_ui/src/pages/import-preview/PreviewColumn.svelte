<script lang="ts">
  import { Dropdown, TextInput, Checkbox } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import { AbstractTypeControl } from '@mathesar/components/abstract-type-control';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';

  export let isLoading = false;

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
      disabled={processedColumn.column.primary_key || isLoading}
    />
    <TextInput
      disabled={isLoading}
      bind:value={displayName}
      on:blur={checkAndSetNameIfEmpty}
    />
  </div>
  <Dropdown
    disabled={isLoading}
    triggerClass="column-type"
    triggerAppearance="plain"
  >
    <NameWithIcon slot="trigger" icon={processedColumn.abstractType.icon}>
      {processedColumn.abstractType.name}
    </NameWithIcon>
    <div slot="content" class="type-options-content">
      <AbstractTypeControl
        column={{
          ...processedColumn.column,
          abstractType: processedColumn.abstractType,
        }}
      />
    </div>
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

  .type-options-content {
    min-width: 18rem;
    max-width: 22rem;
  }
</style>
