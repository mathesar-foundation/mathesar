<script lang="ts">
  import { Collapsible } from '@mathesar-component-library';
  import { tables } from '@mathesar/stores/tables';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import FkRecordSummaryConfig from '@mathesar/systems/table-view/table-inspector/record-summary/FkRecordSummaryConfig.svelte';
  import { labeledCount } from '@mathesar/utils/languageUtils';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import RenameColumn from './RenameColumn.svelte';
  import ColumnActions from './ColumnActions.svelte';
  import ColumnOptions from './ColumnOptions.svelte';
  import ColumnType from './ColumnType.svelte';
  import CollapsibleHeader from '../CollapsibleHeader.svelte';
  import ColumnTypeSpecifierTag from './ColumnTypeSpecifierTag.svelte';
  import ColumnFormatting from './ColumnFormatting.svelte';
  import SetDefaultValue from './SetDefaultValue.svelte';

  const tabularData = getTabularDataStoreFromContext();
  const userProfile = getUserProfileStoreFromContext();

  $: database = $currentDatabase;
  $: schema = $currentSchema;
  $: ({ processedColumns, selection } = $tabularData);
  $: ({ selectedCells, columnsSelectedWhenTheTableIsEmpty } = selection);
  $: selectedColumns = (() => {
    const ids = selection.getSelectedUniqueColumnsId(
      $selectedCells,
      $columnsSelectedWhenTheTableIsEmpty,
    );
    const columns = [];
    for (const id of ids) {
      const c = $processedColumns.get(id);
      if (c !== undefined) {
        columns.push(c);
      }
    }
    return columns;
  })();
  /** When only one column is selected */
  $: column = selectedColumns.length === 1 ? selectedColumns[0] : undefined;

  $: canExecuteDDL = $userProfile?.hasPermission(
    { database, schema },
    'canExecuteDDL',
  );
  $: canEditMetadata = $userProfile?.hasPermission(
    { database, schema },
    'canEditMetadata',
  );
</script>

<div class="column-mode-container">
  {#if selectedColumns.length === 0}
    <span class="no-cell-selected">
      Select one or more columns or cells to view the associated column
      properties and actions.
    </span>
  {:else}
    {#if selectedColumns.length > 1}
      <span class="columns-selected-count">
        {labeledCount(selectedColumns, 'columns')} selected
      </span>
    {/if}
    <!-- TODO: Needs UX review in PR description -->
    {#if column && canExecuteDDL}
      <Collapsible isOpen triggerAppearance="plain">
        <CollapsibleHeader
          slot="header"
          title="Properties"
          isDbLevelConfiguration
        />
        <div slot="content" class="content-container">
          <RenameColumn
            {column}
            columnsDataStore={$tabularData.columnsDataStore}
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
            />
          {/if}
        </div>
      </Collapsible>
    {/if}

    {#if column}
      <Collapsible isOpen triggerAppearance="plain">
        <CollapsibleHeader
          slot="header"
          title="Data Type"
          isDbLevelConfiguration
        />
        <div slot="content" class="content-container">
          <ColumnType {column} {canExecuteDDL} />
        </div>
      </Collapsible>
    {/if}

    {#if column && !column.column.default?.is_dynamic}
      <Collapsible isOpen triggerAppearance="plain">
        <CollapsibleHeader
          slot="header"
          title="Default Value"
          isDbLevelConfiguration
        />
        <div slot="content" class="content-container">
          <SetDefaultValue {column} {canExecuteDDL} />
        </div>
      </Collapsible>
    {/if}

    {#if column && canEditMetadata}
      <Collapsible triggerAppearance="plain">
        <CollapsibleHeader slot="header" title="Formatting" />
        <div slot="content" class="content-container">
          {#key column}
            <ColumnFormatting {column} />
          {/key}
        </div>
      </Collapsible>
    {/if}

    {#if column}
      {@const referentTableId = column.linkFk?.referent_table}
      {@const referentTable =
        referentTableId === undefined
          ? undefined
          : $tables.data.get(referentTableId)}
      {#if referentTable !== undefined}
        <Collapsible triggerAppearance="plain">
          <CollapsibleHeader slot="header" title="Linked Record Summary" />
          <div slot="content" class="content-container">
            <FkRecordSummaryConfig table={referentTable} />
          </div>
        </Collapsible>
      {/if}
    {/if}

    {#if canExecuteDDL}
      <Collapsible isOpen triggerAppearance="plain">
        <CollapsibleHeader slot="header" title="Actions" />
        <div slot="content" class="content-container">
          <ColumnActions columns={selectedColumns} />
        </div>
      </Collapsible>
    {/if}
  {/if}
</div>

<style lang="scss">
  .column-mode-container {
    padding-bottom: 1rem;
    display: flex;
    flex-direction: column;
  }

  .no-cell-selected {
    padding: 2rem;
  }

  .content-container {
    padding: 1rem;
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }

  .columns-selected-count {
    padding: 1rem;
  }
</style>
