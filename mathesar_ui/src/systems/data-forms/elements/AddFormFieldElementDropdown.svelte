<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import type { Table } from '@mathesar/models/Table';
  import { TableStructure } from '@mathesar/stores/table-data';
  import {
    ButtonMenuItem,
    DropdownMenu,
    MenuDivider,
    MenuHeading,
  } from '@mathesar-component-library';

  import { type DataFormManager } from '../DataFormManager';

  export let dataFormManager: DataFormManager;

  export let table: Table;
  $: tableStructure = dataFormManager.tableStructureCache.get(
    table.oid,
    () => new TableStructure(table),
  );
  $: ({ processedColumns } = tableStructure);
  $: nonFkProcessedColumns = [...$processedColumns.values()].filter(
    (pc) => !pc.linkFk,
  );
  $: fkProcessedColumns = [...$processedColumns.values()].filter(
    (pc) => pc.linkFk,
  );
  $: tableStructureAsyncStore = tableStructure.asyncStore;
  $: tableStructureSubstance = $tableStructureAsyncStore.resolvedValue;
</script>

<div class="add-field">
  <DropdownMenu
    showArrow={false}
    triggerAppearance="outcome"
    icon={iconAddNew}
    preferredPlacement="bottom-end"
    closeOnInnerClick={false}
    let:close
  >
    <MenuHeading>
      <TableName {table} />
    </MenuHeading>
    <MenuDivider />
    {#each nonFkProcessedColumns as processedColumn (processedColumn.id)}
      <ButtonMenuItem
        disabled={processedColumn.column.default?.is_dynamic}
        on:click={() => close()}
      >
        <ProcessedColumnName {processedColumn} />
      </ButtonMenuItem>
    {/each}
    {#if fkProcessedColumns.length > 0}
      <MenuHeading>{$_('links_from_table')}</MenuHeading>
      {#each fkProcessedColumns as processedColumn (processedColumn.id)}
        <ButtonMenuItem
          disabled={processedColumn.column.default?.is_dynamic}
          on:click={() => close()}
        >
          <ProcessedColumnName {processedColumn} />
        </ButtonMenuItem>
      {/each}
    {/if}
    {#if tableStructureSubstance?.linksToTable && tableStructureSubstance.linksToTable.length}
      <MenuHeading>{$_('links_to_table')}</MenuHeading>
      {#each tableStructureSubstance.linksToTable as linkToTable (linkToTable)}
        <ButtonMenuItem on:click={() => close()}>
          <TableName table={linkToTable.table} />
        </ButtonMenuItem>
      {/each}
    {/if}
  </DropdownMenu>
</div>

<style lang="scss">
  .add-field {
    display: flex;
    align-items: center;
    justify-content: center;
  }
</style>
