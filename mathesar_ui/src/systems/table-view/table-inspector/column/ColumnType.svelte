<script lang="ts">
  import {
    getTabularDataStoreFromContext,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { AbstractTypeControl } from '@mathesar/components/abstract-type-control';
  import type { ColumnTypeOptionsSaveArgs } from '@mathesar/components/abstract-type-control/types';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);

  export let column: ProcessedColumn;

  async function save(
    columnInfo: Pick<ColumnTypeOptionsSaveArgs, 'type' | 'type_options'>,
  ) {
    await columnsDataStore.patch(column.id, {
      type: columnInfo.type,
      type_options: columnInfo.type_options,
    });
  }
</script>

<AbstractTypeControl
  column={{
    ...column.column,
    abstractType: column.abstractType,
  }}
  {save}
/>
