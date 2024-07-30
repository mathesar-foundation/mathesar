<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { AbstractTypeControl } from '@mathesar/components/abstract-type-control';
  import AbstractTypeSelector from '@mathesar/components/abstract-type-control/AbstractTypeSelector.svelte';
  import type { ColumnTypeOptionsSaveArgs } from '@mathesar/components/abstract-type-control/types';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import {
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);

  export let column: ProcessedColumn;

  async function save(
    columnInfo: Pick<ColumnTypeOptionsSaveArgs, 'type' | 'type_options'>,
  ) {
    await columnsDataStore.patch({
      id: column.id,
      type: columnInfo.type,
      type_options: columnInfo.type_options,
      default: null,
    });
  }
  $: disallowDataTypeChange = column.column.primary_key || !!column.linkFk;
  $: columnWithAbstractType = {
    ...column.column,
    abstractType: column.abstractType,
  };
  $: infoAlertText = (() => {
    if (column.column.primary_key) {
      return $_('data_type_pk_column_restricted');
    }
    if (column.linkFk) {
      return $_('data_type_linked_column_restricted');
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
