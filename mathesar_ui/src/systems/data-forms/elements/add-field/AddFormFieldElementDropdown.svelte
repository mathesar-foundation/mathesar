<script lang="ts">
  import { _ } from 'svelte-i18n';

  import TableName from '@mathesar/components/TableName.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import {
    ButtonMenuItem,
    DropdownMenu,
    MenuDivider,
    MenuHeading,
    Spinner,
  } from '@mathesar-component-library';

  import type { ParentEphemeralField } from '../../data-form-utilities/AbstractEphemeralField';
  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';
  import { columnToEphemeralField } from '../../data-form-utilities/transformers';

  import AddFormColumnFieldItem from './AddFormColumnFieldItem.svelte';

  export let dataFormManager: EditableDataFormManager;
  export let parentField: ParentEphemeralField;
  export let insertionIndex: number;
  export let display: 'tiny' | 'full' = 'tiny';

  $: ({ ephemeralDataForm, reverseForeignKeyEnabled } = dataFormManager);

  $: tableOidOfField = parentField
    ? parentField.relatedTableOid
    : ephemeralDataForm.baseTableOid;

  $: tableStructure = dataFormManager.getTableStructure(tableOidOfField);
  $: ({ processedColumns, isLoading } = tableStructure);
  $: scalarColumns = [...$processedColumns.values()].filter((pc) => !pc.linkFk);
  $: fkProcessedColumns = [...$processedColumns.values()].filter(
    (pc) => pc.linkFk,
  );
  $: tableStructureAsyncStore = tableStructure.asyncStore;
  $: tableStructureSubstance = $tableStructureAsyncStore.resolvedValue;
  $: table = tableStructureSubstance?.table;
  $: linksToTable = tableStructureSubstance?.linksToTable;

  $: parentFieldsList = parentField
    ? parentField.nestedFields
    : ephemeralDataForm.fields;

  async function addColumnAsField(
    processedColumn: ProcessedColumn,
    close: () => void,
  ) {
    const result = await tableStructureAsyncStore.tick();
    if (result.resolvedValue) {
      const epf = columnToEphemeralField(
        processedColumn,
        result.resolvedValue,
        parentField,
        insertionIndex,
      );
      dataFormManager.insertField(epf);
    }
    close();
  }
</script>

<div class="add-field">
  <DropdownMenu
    showArrow={false}
    triggerAppearance={display === 'tiny' ? 'outcome' : 'secondary'}
    icon={iconAddNew}
    label={display === 'full' ? $_('add_fields') : ''}
    preferredPlacement="bottom-end"
    closeOnInnerClick={false}
    let:close
  >
    {#if $isLoading}
      <Spinner />
    {:else}
      <MenuHeading>
        {#if table}
          <TableName {table} />
        {/if}
      </MenuHeading>
      <MenuDivider />
      {#each scalarColumns as processedColumn (processedColumn.id)}
        <AddFormColumnFieldItem
          {processedColumn}
          parentHasColumn={parentFieldsList.hasScalarColumn(processedColumn)}
          on:click={() => addColumnAsField(processedColumn, close)}
        />
      {/each}
      {#if fkProcessedColumns.length > 0}
        <MenuHeading>{$_('links_from_table')}</MenuHeading>
        {#each fkProcessedColumns as processedColumn (processedColumn.id)}
          <AddFormColumnFieldItem
            {processedColumn}
            parentHasColumn={parentFieldsList.hasFkColumn(processedColumn)}
            on:click={() => addColumnAsField(processedColumn, close)}
          />
        {/each}
      {/if}
      {#if reverseForeignKeyEnabled && linksToTable && linksToTable.length}
        <MenuHeading>{$_('links_to_table')}</MenuHeading>
        {#each linksToTable as linkToTable (linkToTable)}
          <ButtonMenuItem on:click={() => close()}>
            <TableName table={linkToTable.table} />
          </ButtonMenuItem>
        {/each}
      {/if}
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
