<script lang="ts">
  import { _ } from 'svelte-i18n';

  import InspectorSection from '@mathesar/components/InspectorSection.svelte';
  import {
    tableInspectorColumnActionsVisible,
    tableInspectorColumnDataTypeVisible,
    tableInspectorColumnDefaultValueVisible,
    tableInspectorColumnFormattingVisible,
    tableInspectorColumnPropertiesVisible,
    tableInspectorColumnRecordSummaryVisible,
  } from '@mathesar/stores/localStorage';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { currentTablesData } from '@mathesar/stores/tables';
  import FkRecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/FkRecordSummaryConfig.svelte';
  import { defined } from '@mathesar-component-library';

  import ColumnActions from './ColumnActions.svelte';
  import ColumnFormatting from './ColumnFormatting.svelte';
  import ColumnNameAndDescription from './ColumnNameAndDescription.svelte';
  import ColumnOptions from './ColumnOptions.svelte';
  import ColumnType from './ColumnType.svelte';
  import ColumnTypeSpecifierTag from './ColumnTypeSpecifierTag.svelte';
  import SetDefaultValue from './SetDefaultValue.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ table, processedColumns, selection, selectedCellData } = $tabularData);
  $: ({ currentRoleOwns } = table.currentAccess);
  $: selectedColumns = (() => {
    const ids = $selection.columnIds;
    const columns = [];
    for (const id of ids) {
      // This is a  little annoying that we need to parse the id as a string to
      // a number. The reason is tricky. The cell selection system uses strings
      // as column ids because they're more general purpose and can work with
      // the string-based ids that the data explorer uses. However the table
      // page stores processed columns with numeric ids. We could avoid this
      // parsing by either making the selection system generic over the id type
      // (which would be a pain, ergonomically), or by using string-based ids
      // for columns in the table page too (which would require refactoring).
      const parsedId = parseInt(id, 10);
      const column = $processedColumns.get(parsedId);
      if (column !== undefined) {
        columns.push(column);
      }
    }
    return columns;
  })();
  /** When only one column is selected */
  $: column = selectedColumns.length === 1 ? selectedColumns[0] : undefined;
  $: linkedTable = defined(column?.linkFk?.referent_table_oid, (id) =>
    $currentTablesData.tablesMap.get(id),
  );
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
          <ColumnOptions
            {column}
            columnsDataStore={$tabularData.columnsDataStore}
            constraintsDataStore={$tabularData.constraintsDataStore}
            currentRoleOwnsTable={$currentRoleOwns}
          />
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

  {#if column && !column.column.default?.is_dynamic}
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

  <InspectorSection
    title={$_('actions')}
    bind:isOpen={$tableInspectorColumnActionsVisible}
  >
    <ColumnActions columns={selectedColumns} />
  </InspectorSection>
{/if}

<style lang="scss">
  .no-cell-selected {
    padding: var(--lg4);
  }

  .columns-selected-count {
    padding: 1rem;
  }
</style>
