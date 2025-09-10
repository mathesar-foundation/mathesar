<script lang="ts">
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import TableLink from '@mathesar/components/TableLink.svelte';
  import TableName from '@mathesar/components/TableName.svelte';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../data-form-utilities/fields';

  export let dataFormManager: EditableDataFormManager;
  export let dataFormField: DataFormField;
  export let link = false;
  export let separator = false;

  $: tableOidOfField = dataFormField.container.getTableOid();
  $: tableStructure = dataFormManager.getTableStructure(tableOidOfField);
  $: ({ table } = tableStructure);
</script>

<div class="field-source" class:separator>
  {#if $table}
    <div class="tag">
      {#if link}
        <TableLink table={$table} alwaysShowTooltip={true} />
      {:else}
        <TableName table={$table} alwaysShowTooltip={true} />
      {/if}
    </div>
  {/if}
  {#if 'fieldColumn' in dataFormField}
    {#if separator}
      <span class="separator">.</span>
    {/if}
    <div class="tag">
      <ColumnName
        column={{
          ...dataFormField.fieldColumn.column,
          constraintsType:
            dataFormField.kind === 'foreign_key' ? ['foreignkey'] : [],
        }}
        alwaysShowTooltip={true}
      />
    </div>
  {/if}
</div>

<style lang="scss">
  .field-source {
    display: inline-flex;
    align-items: baseline;
    font-size: var(--df__internal__field-source-font-size, var(--sm1));

    &:not(.separator) {
      gap: var(--sm6);
    }

    .tag {
      border-radius: var(--border-radius-xl);
      background-color: var(--color-bg-raised-2);
      border: 1px solid var(--color-border-raised-2);
      padding: var(--sm6) var(--sm3);
      max-width: var(--df__internal__field-source-max-width, none);
      font-weight: var(--font-weight-medium);
      overflow: hidden;
    }
    .separator {
      font-weight: var(--font-weight-bold);
      font-size: var(--lg1);
    }
  }
</style>
