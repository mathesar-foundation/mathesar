<script lang="ts">
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import type { Table } from '@mathesar/models/Table';

  import type { EphemeralDataFormField } from '../../data-form-utilities/AbstractEphemeralField';
  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';

  export let dataFormManager: EditableDataFormManager;
  export let dataFormField: EphemeralDataFormField;
  export let tableOidOfField: Table['oid'];

  $: tableStructure = dataFormManager.getTableStructure(tableOidOfField);
  $: tableStructureStore = tableStructure.asyncStore;
  $: table = $tableStructureStore.resolvedValue?.table;
</script>

<div class="actions">
  <div class="source">
    <div class="tag">
      {#if table}
        <TableName {table} alwaysShowTooltip={true} />
      {/if}
    </div>
    {#if dataFormField.kind !== 'reverse_foreign_key'}
      <span>.</span>
      <div class="tag">
        <ProcessedColumnName
          processedColumn={dataFormField.processedColumn}
          alwaysShowTooltip={true}
        />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .source {
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

  .actions {
    margin-left: auto;
    --button-border-radius: var(--lg1);
  }
</style>
