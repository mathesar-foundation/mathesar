<script lang="ts">
  import {
    ButtonMenuItem,
    DropdownMenu,
    iconExpandDown,
    Label,
    LabelController,
  } from '@mathesar/component-library';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import type { FieldStore } from '@mathesar/components/form';
  import FieldErrors from '@mathesar/components/form/FieldErrors.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { iconSetToNull } from '@mathesar/icons';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import type RecordStore from './RecordStore';

  const labelController = new LabelController();

  export let record: RecordStore;
  export let processedColumn: ProcessedColumn;
  export let field: FieldStore;

  $: ({ recordSummaries } = record);
  $: ({ column } = processedColumn);
  $: value = $field;
  $: ({ showsError } = field);
  $: disabled = column.primary_key;
</script>

<div class="direct-field">
  <div class="left cell">
    <div class="complex-label">
      <div class="label">
        <Label controller={labelController}>
          <ProcessedColumnName {processedColumn} />
        </Label>
      </div>
      <div class="options">
        <DropdownMenu
          showArrow={false}
          triggerAppearance="plain"
          closeOnInnerClick={true}
          label=""
          icon={iconExpandDown}
        >
          <ButtonMenuItem icon={iconSetToNull}>Set to <Null /></ButtonMenuItem>
        </DropdownMenu>
      </div>
    </div>
  </div>

  <div class="input cell">
    <DynamicInput
      bind:value={$field}
      {disabled}
      componentAndProps={processedColumn.inputComponentAndProps}
      {labelController}
      recordSummary={$recordSummaries
        .get(String(column.id))
        ?.get(String(value))}
      setRecordSummary={(recordId, recordSummary) =>
        recordSummaries.addBespokeRecordSummary({
          columnId: String(column.id),
          recordId,
          recordSummary,
        })}
      hasError={$showsError}
    />
    <FieldErrors {field} />
  </div>
</div>

<style>
  .direct-field {
    display: contents;
    --alert-margin: 0.5rem 0 0 0;
  }
  .direct-field:not(:last-child) .cell {
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: solid var(--color-gray-light) 1px;
  }
  .left {
    display: flex;
    align-items: flex-start;
    justify-content: end;
  }
  .complex-label {
    display: flex;
    align-items: center;
    justify-content: end;
  }
  .options {
    margin: 0 0.2rem;
  }
</style>
