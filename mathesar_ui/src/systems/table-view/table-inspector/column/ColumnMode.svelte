<script lang="ts">
  import { Collapsible } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import RenameColumn from './RenameColumn.svelte';
  // import ColumnDisplayProperties from './ColumnDisplayProperties.svelte';
  import ColumnActions from './ColumnActions.svelte';
  import ColumnOptions from './ColumnOptions.svelte';
  import ColumnType from './ColumnType.svelte';
  import CollapsibleHeader from '../CollapsibleHeader.svelte';
  import SetDefaultValue from './SetDefaultValue.svelte';
  import ColumnTypeSpecifierTag from './ColumnTypeSpecifierTag.svelte';

  const tabularData = getTabularDataStoreFromContext();
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
        {selectedColumns.length} columns selected
      </span>
    {/if}
    {#if column}
      <Collapsible isOpen>
        <CollapsibleHeader
          slot="header"
          title="Properties"
          isDBLevelConfiguration
        />
        <div slot="content" class="content-container">
          <RenameColumn
            {column}
            columnsDataStore={$tabularData.columnsDataStore}
          />
          <!-- <ColumnDisplayProperties {column} meta={$tabularData.meta} /> -->
          <!-- TODO: Handle for FK too -->
          {#if column.column.primary_key}
            <ColumnTypeSpecifierTag {column} type="primaryKey" />
          {:else}
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
      <Collapsible isOpen>
        <CollapsibleHeader
          slot="header"
          title="Data Type"
          isDBLevelConfiguration
        />
        <div slot="content" class="content-container">
          <ColumnType {column} />
        </div>
      </Collapsible>
    {/if}

    {#if column}
      <Collapsible isOpen>
        <CollapsibleHeader
          slot="header"
          title="Default Value"
          isDBLevelConfiguration
        />
        <div slot="content" class="content-container">
          <SetDefaultValue />
        </div>
      </Collapsible>
    {/if}

    <Collapsible isOpen>
      <CollapsibleHeader slot="header" title="Actions" />
      <div slot="content" class="content-container">
        <ColumnActions
          columns={selectedColumns}
          columnsDataStore={$tabularData.columnsDataStore}
        />
      </div>
    </Collapsible>
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
