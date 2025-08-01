<script lang="ts">
  import { _ } from 'svelte-i18n';

  import TableName from '@mathesar/components/TableName.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import {
    DropdownMenu,
    MenuDivider,
    Spinner,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';
  import { FieldColumn } from '../../data-form-utilities/FieldColumn';
  import type { FormFields } from '../../data-form-utilities/FormFields';

  import AddFormColumnFieldItem from './AddFormColumnFieldItem.svelte';

  export let dataFormManager: EditableDataFormManager;
  export let fieldHolder: FormFields;
  export let insertionIndex: number;
  export let display: 'tiny' | 'full' = 'tiny';

  $: tableOidOfField = fieldHolder.getTableOid();
  $: tableStructure = dataFormManager.getTableStructure(tableOidOfField);
  $: ({ processedColumns, isLoading } = tableStructure);
  $: fieldColumns = [...$processedColumns.values()].map((pc) =>
    FieldColumn.fromProcessedColumn(pc),
  );
  $: ({ table } = tableStructure);

  async function addColumnAsField(fc: FieldColumn, close: () => void) {
    const tableStructureSubstance =
      await tableStructure.getSubstanceOnceResolved();
    if (tableStructureSubstance.resolvedValue) {
      fieldHolder.addFromFieldColumn(
        fc,
        insertionIndex,
        tableStructureSubstance.resolvedValue,
      );
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
      <div class="add-field-table">
        {#if $table}
          <TableName table={$table} truncate={false} />
        {/if}
      </div>
      <MenuDivider />
      {#each fieldColumns as fieldColumn (fieldColumn.column.id)}
        <AddFormColumnFieldItem
          {fieldColumn}
          parentHasColumn={fieldHolder.hasColumn(fieldColumn)}
          on:click={() => addColumnAsField(fieldColumn, close)}
        />
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
  .add-field-table {
    font-weight: 500;
    padding: var(--sm4) var(--sm2);
    min-width: 16rem;
  }
</style>
