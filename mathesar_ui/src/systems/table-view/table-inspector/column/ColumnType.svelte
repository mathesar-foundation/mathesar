<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { AbstractTypeControl } from '@mathesar/components/abstract-type-control';
  import type { ColumnTypeOptionsSaveArgs } from '@mathesar/components/abstract-type-control/types';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import {
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ table, columnsDataStore } = $tabularData);
  $: ({ currentRoleOwns } = table.currentAccess);

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
  $: disallowDataTypeChange =
    column.column.primary_key || !!column.linkFk || !$currentRoleOwns;
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

{#key columnWithAbstractType}
  <AbstractTypeControl
    column={columnWithAbstractType}
    {save}
    disabled={disallowDataTypeChange}
  />
{/key}
{#if infoAlertText}
  <InfoBox>
    <span class="info-alert">
      {infoAlertText}
    </span>
  </InfoBox>
{/if}

<style lang="scss">
  .info-alert {
    font-size: var(--text-size-small);
  }
</style>
