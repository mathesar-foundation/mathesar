<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import TableLink from '@mathesar/components/TableLink.svelte';
  import {
    tableInspectorColumnActionsVisible,
    tableInspectorColumnDataTypeVisible,
    tableInspectorColumnDefaultValueVisible,
    tableInspectorColumnFormattingVisible,
    tableInspectorColumnPropertiesVisible,
    tableInspectorColumnRecordSummaryVisible,
  } from '@mathesar/stores/localStorage';
  import {
    type ProcessedColumn,
    getTabularDataStoreFromContext,
    isJoinedColumn,
  } from '@mathesar/stores/table-data';
  import { currentTablesData } from '@mathesar/stores/tables';
  import FkRecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/FkRecordSummaryConfig.svelte';
  import { isTableView } from '@mathesar/utils/tables';
  import { defined } from '@mathesar-component-library';

  import ColumnActions from './ColumnActions.svelte';
  import ColumnFormatting from './ColumnFormatting.svelte';
  import ColumnNameAndDescription from './ColumnNameAndDescription.svelte';
  import ColumnOptions from './ColumnOptions.svelte';
  import ColumnType from './ColumnType.svelte';
  import ColumnTypeSpecifierTag from './ColumnTypeSpecifierTag.svelte';
  import SetDefaultValue from './SetDefaultValue.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ table, allColumns, selection, selectedCellData } = $tabularData);
  $: ({ currentRoleOwns } = table.currentAccess);
  $: selectedColumns = (() => {
    const ids = $selection.columnIds;
    const columns = [];
    for (const id of ids) {
      const column = $allColumns.get(id);
      if (column !== undefined) {
        columns.push(column);
      }
    }
    return columns;
  })();
  /** When only one column is selected */
  $: singleSelectedColumn =
    selectedColumns.length === 1 ? selectedColumns[0] : undefined;
  $: column =
    singleSelectedColumn && !isJoinedColumn(singleSelectedColumn)
      ? singleSelectedColumn
      : undefined;
  $: joinedColumn =
    singleSelectedColumn && isJoinedColumn(singleSelectedColumn)
      ? singleSelectedColumn
      : undefined;
  $: selectedProcessedColumns = selectedColumns.filter(
    (col): col is ProcessedColumn => !isJoinedColumn(col),
  );
  $: linkedTable = defined(column?.linkFk?.referent_table_oid, (id) =>
    $currentTablesData.tablesMap.get(id),
  );
  $: joinInfo = (() => {
    if (!joinedColumn) return undefined;
    const { targetTableOid, intermediateTableOid } = joinedColumn;
    const { tablesMap } = $currentTablesData;

    const targetTable = targetTableOid
      ? tablesMap.get(targetTableOid)
      : undefined;
    const mappingTable = tablesMap.get(intermediateTableOid);

    return {
      targetTable,
      mappingTable,
    };
  })();
  $: isView = isTableView(table);
</script>

{#if selectedColumns.length === 0}
  <span class="no-cell-selected">
    {$_('select_columns_cells_view_properties')}
  </span>
{:else}
  {#if selectedColumns.length > 1}
    <span class="columns-selected-count">
      {$_('multiple_columns_selected', {
        values: { count: selectedColumns.length },
      })}
    </span>
  {/if}
  {#if joinInfo}
    <div class="joined-column-info">
      <WarningBox>
        {$_('joined_column_tooltip')}
      </WarningBox>
      {#if joinInfo.targetTable}
        <div class="table-link-group">
          <div class="table-link-header">
            {$_('joined_table')}
          </div>
          <TableLink table={joinInfo.targetTable} />
        </div>
      {/if}
      {#if joinInfo.mappingTable}
        <div class="table-link-group">
          <div class="table-link-header">
            {$_('mapping_table')}
          </div>
          <TableLink table={joinInfo.mappingTable} />
        </div>
      {/if}
    </div>
  {/if}
  {#if column}
    {#key column}
      <InspectorSection
        title={$_('column_properties')}
        bind:isOpen={$tableInspectorColumnPropertiesVisible}
        isDbLevelConfiguration
      >
        <ColumnNameAndDescription
          {column}
          columnsDataStore={$tabularData.columnsDataStore}
          currentRoleOwnsTable={$currentRoleOwns}
        />
        {#if column.column.primary_key}
          <ColumnTypeSpecifierTag {column} type="primaryKey" />
        {:else}
          {#if !!column.linkFk}
            <ColumnTypeSpecifierTag {column} type="foreignKey" />
          {/if}
          {#if !isView}
            <ColumnOptions
              {column}
              columnsDataStore={$tabularData.columnsDataStore}
              constraintsDataStore={$tabularData.constraintsDataStore}
              currentRoleOwnsTable={$currentRoleOwns}
            />
          {/if}
        {/if}
      </InspectorSection>
    {/key}
  {/if}

  {#if column}
    <InspectorSection
      title={$_('data_type')}
      bind:isOpen={$tableInspectorColumnDataTypeVisible}
      isDbLevelConfiguration
    >
      <ColumnType {column} />
    </InspectorSection>
  {/if}

  {#if !isView && column && !column.column.default?.is_dynamic}
    <InspectorSection
      title={$_('default_value')}
      bind:isOpen={$tableInspectorColumnDefaultValueVisible}
      isDbLevelConfiguration
    >
      <SetDefaultValue {column} />
    </InspectorSection>
  {/if}

  {#if column}
    <InspectorSection
      title={$_('formatting')}
      bind:isOpen={$tableInspectorColumnFormattingVisible}
    >
      {#key column}
        <ColumnFormatting {column} />
      {/key}
    </InspectorSection>
  {/if}

  {#if linkedTable}
    <InspectorSection
      title={$_('linked_record_summary')}
      bind:isOpen={$tableInspectorColumnRecordSummaryVisible}
    >
      <FkRecordSummaryConfig
        {linkedTable}
        previewRecordId={$selectedCellData.activeCellData?.value}
        onSave={() => $tabularData.recordsData.fetch()}
      />
    </InspectorSection>
  {/if}

  {#if !isView && selectedProcessedColumns.length > 0}
    <InspectorSection
      title={$_('actions')}
      bind:isOpen={$tableInspectorColumnActionsVisible}
    >
      <ColumnActions columns={selectedProcessedColumns} />
    </InspectorSection>
  {/if}
{/if}

<style lang="scss">
  .no-cell-selected {
    padding: var(--lg4);
  }

  .columns-selected-count {
    padding: 1rem;
  }

  .joined-column-info {
    padding: var(--sm1);
    display: flex;
    flex-direction: column;
    gap: var(--sm1);

    .table-link-group {
      display: flex;
      flex-direction: column;
      gap: var(--sm5);
      padding: var(--sm6);
    }

    .table-link-header {
      color: var(--color-fg-subtle-1);
      font-size: var(--sm1);
      font-weight: var(--font-weight-medium);
    }
  }
</style>
