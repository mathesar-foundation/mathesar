<script lang="ts">
  import { Dropdown } from '@mathesar-component-library';
  import type { Column } from '@mathesar/api/tables/columns';
  import { AbstractTypeControl } from '@mathesar/components/abstract-type-control';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';

  export let processedColumn: {
    column: Column;
    abstractType: AbstractType;
  };
</script>

<div class="column">
  <div>{processedColumn.column.name}</div>
  <Dropdown>
    <span slot="trigger">{processedColumn.abstractType.name}</span>
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

    > div {
      height: 32px;
    }
  }
</style>
