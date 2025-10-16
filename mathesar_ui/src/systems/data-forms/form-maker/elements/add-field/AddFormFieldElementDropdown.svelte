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
  import {
    FieldColumn,
    type FormFields,
    buildFieldFactoryFromColumn,
  } from '../../data-form-utilities/fields';

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
    fieldHolder.add(
      buildFieldFactoryFromColumn({
        fieldColumn: fc,
        index: insertionIndex,
      }),
    );
    close();
  }
</script>

<div class="add-field">
  <DropdownMenu
    showArrow={false}
    triggerAppearance={display === 'tiny' ? 'custom' : 'secondary'}
    triggerClass="add-field-button"
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

    :global(.btn-custom.add-field-button) {
      --button-padding: var(--sm5) var(--sm4);

      --button-background: var(--color-selection-strong-2);
      --button-border-color: var(--color-selection-strong-2);
      --button-color: var(--color-fg-inverted);

      --button-hover-box-shadow: 0 1px 2px
          color-mix(in srgb, var(--color-shadow), transparent 5%),
        0 1px 3px color-mix(in srgb, var(--color-shadow), transparent 10%),
        0 1px 2px -1px color-mix(in srgb, var(--color-shadow), transparent 10%);

      --button-focus-outline-color: color-mix(
        in srgb,
        var(--color-selection-strong-1),
        transparent 10%
      );

      --button-active-box-shadow: 0 1px 2px
          color-mix(in srgb, var(--color-shadow), transparent 5%),
        0 1px 3px color-mix(in srgb, var(--color-shadow), transparent 10%),
        0 1px 2px -1px color-mix(in srgb, var(--color-shadow), transparent 10%),
        inset 1px 1px 2px
          color-mix(in srgb, var(--color-shadow-dark), transparent 10%),
        inset -1px -1px 2px
          color-mix(in srgb, var(--color-shadow-dark), transparent 10%);
    }
  }
  .add-field-table {
    font-weight: 500;
    padding: var(--sm4) var(--sm2);
    min-width: 16rem;
  }
</style>
