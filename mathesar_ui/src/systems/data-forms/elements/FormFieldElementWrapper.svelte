<script lang="ts">
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Button, Icon } from '@mathesar-component-library';

  import type { DataFormManager } from '../DataFormManager';
  import type { EphemeralDataFormField } from '../EphemeralDataForm';

  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;
  export let dataFormField: EphemeralDataFormField;
</script>

<SelectableElement
  elementId={dataFormField.key}
  {dataFormManager}
  let:isSelected
>
  <svelte:fragment slot="header">
    <div class="actions">
      <div class="source">
        <div class="tag">
          <TableName table={dataFormField.table} alwaysShowTooltip={true} />
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
      <Button>
        <Icon {...iconDeleteMajor} />
      </Button>
    </div>
  </svelte:fragment>

  <div class="form-field-content">
    <slot {isSelected} />
  </div>
</SelectableElement>

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
  .form-field-content {
    padding: var(--sm2);
  }
</style>
