<script lang="ts">
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { ensureReadable } from '@mathesar-component-library';

  import type { EphemeralDataFormField } from '../../data-form-utilities/AbstractEphemeralField';
  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../../data-form-utilities/DataFormManager';

  import AddFormFieldElementDropdown from './AddFormFieldElementDropdown.svelte';
  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphemeralDataFormField;

  $: primaryTableOid =
    dataFormField.kind === 'reverse_foreign_key'
      ? dataFormField.relatedTableOid
      : dataFormField.processedColumn.tableOid;
  $: primaryTableStructure =
    dataFormManager instanceof EditableDataFormManager
      ? dataFormManager.getTableStructure(primaryTableOid)
      : undefined;
  $: primaryTableStructureStore = ensureReadable(
    primaryTableStructure?.asyncStore,
  );
  $: primaryTable = $primaryTableStructureStore?.resolvedValue?.table;
</script>

{#if dataFormManager instanceof EditableDataFormManager}
  <SelectableElement
    elementId={dataFormField.key}
    {dataFormManager}
    let:isSelected
  >
    <svelte:fragment slot="header">
      <div class="actions">
        <div class="source">
          <div class="tag">
            {#if primaryTable}
              <TableName table={primaryTable} alwaysShowTooltip={true} />
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
    </svelte:fragment>

    <slot {isSelected} />

    <svelte:fragment slot="footer">
      {#if primaryTable}
        <AddFormFieldElementDropdown table={primaryTable} {dataFormManager} />
      {/if}
    </svelte:fragment>
  </SelectableElement>
{:else}
  <slot isSelected={false} />
{/if}

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
