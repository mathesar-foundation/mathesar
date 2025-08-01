<script lang="ts">
  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';

  import type { EditableDataFormManager } from '../data-form-utilities/DataFormManager';
  import type { DataFormField } from '../data-form-utilities/FormFields';

  export let dataFormManager: EditableDataFormManager;
  export let dataFormField: DataFormField;

  $: tableOidOfField = dataFormField.holder.getTableOid();
  $: tableStructure = dataFormManager.getTableStructure(tableOidOfField);
  $: ({ table } = tableStructure);
</script>

<div class="source">
  <div class="tag">
    {#if $table}
      <TableName table={$table} alwaysShowTooltip={true} />
    {/if}
  </div>
  <span>.</span>
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
</div>

<style lang="scss">
  .source {
    margin-left: auto;
    display: inline-flex;
    align-items: center;

    .tag {
      border-radius: var(--border-radius-xl);
      background-color: var(--card-background);
      padding: var(--sm6) var(--sm3);
      font-size: var(--sm2);
      max-width: 8rem;
    }
  }
</style>
