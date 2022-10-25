<script lang="ts">
  import { Collapsible } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { getSelectedUniqueColumnsId } from '@mathesar/components/sheet';
  import RenameColumn from './RenameColumn.svelte';
  import ColumnDisplayProperties from './ColumnDisplayProperties.svelte';
  import ColumnActions from './ColumnActions.svelte';
  import ColumnOptions from './ColumnOptions.svelte';
  import ColumnType from './ColumnType.svelte';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ processedColumns, selection } = $tabularData);
  $: ({ selectedCells, columnsSelectedWhenTheTableIsEmpty } = selection);
  $: selectedColumns = (() => {
    const ids = getSelectedUniqueColumnsId(
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
    <span>
      Select one or more cells to view columns properties and actions.
    </span>
  {:else}
    {#if column}
      <Collapsible isOpen>
        <span slot="header">Column Properties</span>
        <div slot="content" class="property-container">
          <RenameColumn
            {column}
            columnsDataStore={$tabularData.columnsDataStore}
          />
          <ColumnDisplayProperties {column} meta={$tabularData.meta} />
          <ColumnOptions
            {column}
            columnsDataStore={$tabularData.columnsDataStore}
            constraintsDataStore={$tabularData.constraintsDataStore}
          />
        </div>
      </Collapsible>
    {/if}

    {#if column}
      <Collapsible isOpen>
        <span slot="header">Data Type</span>
        <div slot="content" class="actions-container">
          <ColumnType {column} />
        </div>
      </Collapsible>
    {/if}

    <Collapsible isOpen>
      <span slot="header">Actions</span>
      <div slot="content" class="actions-container">
        <ColumnActions
          columns={selectedColumns}
          columnsDataStore={$tabularData.columnsDataStore}
        />
      </div>
    </Collapsible>
  {/if}
</div>

<style>
  .column-mode-container {
    padding: 1rem 0;
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }

  .property-container {
    padding: 1rem;
  }

  .actions-container {
    padding: 1rem 0;
  }
</style>
