<script lang="ts">
  import { Dropdown, TextInput } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import { AbstractTypeControl } from '@mathesar/components/abstract-type-control';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';

  export let processedColumn: {
    column: Column;
    abstractType: AbstractType;
  };
</script>

<div class="column">
  <div class="column-name">
    <TextInput value={processedColumn.column.name} />
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

    > .column-name,
    > :global(.column-type) {
      height: 32px;
      width: 100%;
    }
  }
</style>
