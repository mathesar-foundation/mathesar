<script lang="ts">
  import { _ } from 'svelte-i18n';

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
  import { Collapsible } from '@mathesar-component-library';

  import CollapsibleHeader from '../CollapsibleHeader.svelte';

  import ColumnActions from './ColumnActions.svelte';
  import ColumnFormatting from './ColumnFormatting.svelte';
  import ColumnNameAndDescription from './ColumnNameAndDescription.svelte';
  import ColumnOptions from './ColumnOptions.svelte';
  import ColumnType from './ColumnType.svelte';
  import ColumnTypeSpecifierTag from './ColumnTypeSpecifierTag.svelte';
  import SetDefaultValue from './SetDefaultValue.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ table, processedColumns, selection } = $tabularData);
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
</script>

<div class="column-mode-container">
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
        <Collapsible
          bind:isOpen={$tableInspectorColumnPropertiesVisible}
          triggerAppearance="inspector"
        >
          <CollapsibleHeader
            slot="header"
            title={$_('properties')}
            isDbLevelConfiguration
          />
          <div slot="content" class="content-container column-properties">
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
          </div>
        </Collapsible>
      {/key}
    {/if}

    {#if column}
      <Collapsible
        bind:isOpen={$tableInspectorColumnDataTypeVisible}
        triggerAppearance="inspector"
      >
        <CollapsibleHeader
          slot="header"
          title={$_('data_type')}
          isDbLevelConfiguration
        />
        <div slot="content" class="content-container">
          <ColumnType {column} />
        </div>
      </Collapsible>
    {/if}

    {#if column && !column.column.default?.is_dynamic}
      <Collapsible
        bind:isOpen={$tableInspectorColumnDefaultValueVisible}
        triggerAppearance="inspector"
      >
        <CollapsibleHeader
          slot="header"
          title={$_('default_value')}
          isDbLevelConfiguration
        />
        <div slot="content" class="content-container">
          <SetDefaultValue {column} />
        </div>
      </Collapsible>
    {/if}

    {#if column}
      <Collapsible
        bind:isOpen={$tableInspectorColumnFormattingVisible}
        triggerAppearance="inspector"
      >
        <CollapsibleHeader slot="header" title={$_('formatting')} />
        <div slot="content" class="content-container">
          {#key column}
            <ColumnFormatting {column} />
          {/key}
        </div>
      </Collapsible>
    {/if}

    {#if column}
      {@const referentTableId = column.linkFk?.referent_table_oid}
      {@const referentTable =
        referentTableId === undefined
          ? undefined
          : $currentTablesData.tablesMap.get(referentTableId)}
      {#if referentTable !== undefined}
        <Collapsible
          bind:isOpen={$tableInspectorColumnRecordSummaryVisible}
          triggerAppearance="inspector"
        >
          <CollapsibleHeader
            slot="header"
            title={$_('linked_record_summary')}
          />
          <div slot="content" class="content-container">
            <FkRecordSummaryConfig table={referentTable} />
          </div>
        </Collapsible>
      {/if}
    {/if}

    <Collapsible
      bind:isOpen={$tableInspectorColumnActionsVisible}
      triggerAppearance="inspector"
    >
      <CollapsibleHeader slot="header" title={$_('actions')} />
      <div slot="content" class="content-container">
        <ColumnActions columns={selectedColumns} />
      </div>
    </Collapsible>
  {/if}
</div>

<style lang="scss">
  .column-mode-container {
    padding-bottom: var(--size-small);
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: var(--size-super-ultra-small);
    }
  }

  .no-cell-selected {
    padding: var(--size-ultra-large);
  }

  .content-container {
    padding: var(--size-small);
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }

    &.column-properties {
      > :global(* + *) {
        margin-top: 1rem;
      }
    }
  }

  .columns-selected-count {
    padding: 1rem;
  }
</style>
