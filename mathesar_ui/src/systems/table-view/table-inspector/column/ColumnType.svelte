<script lang="ts">
  import {
    getTabularDataStoreFromContext,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { AbstractTypeControl } from '@mathesar/components/abstract-type-control';
  import type { ColumnTypeOptionsSaveArgs } from '@mathesar/components/abstract-type-control/types';
  import AbstractTypeSelector from '@mathesar/components/abstract-type-control/AbstractTypeSelector.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);

  export let column: ProcessedColumn;
  export let canExecuteDDL: boolean;

  async function save(
    columnInfo: Pick<ColumnTypeOptionsSaveArgs, 'type' | 'type_options'>,
  ) {
    await columnsDataStore.patch(column.id, {
      type: columnInfo.type,
      type_options: columnInfo.type_options,
      display_options: null,
      default: null,
    });
  }
  $: disallowDataTypeChange =
    column.column.primary_key || !!column.linkFk || !canExecuteDDL;
  $: columnWithAbstractType = {
    ...column.column,
    abstractType: column.abstractType,
  };
  $: infoAlertText = (() => {
    if (column.column.primary_key) {
      return 'The data type of the primary key column is restricted and cannot be changed.';
    }
    if (column.linkFk) {
      return 'The data type of the foreign key column is restricted to the data type of the primary key column and cannot be changed.';
    }
    return '';
  })();
</script>

{#if disallowDataTypeChange}
  <AbstractTypeSelector
    selectedAbstractType={column.abstractType}
    column={columnWithAbstractType}
    disabled={true}
  />
  {#if infoAlertText}
    <InfoBox>
      <span class="info-alert">
        {infoAlertText}
      </span>
    </InfoBox>
  {/if}
{:else}
  {#key columnWithAbstractType}
    <AbstractTypeControl column={columnWithAbstractType} {save} />
  {/key}
{/if}

<style lang="scss">
  .info-alert {
    font-size: var(--text-size-small);
  }
</style>
