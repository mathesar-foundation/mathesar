<script lang="ts">
  import {
    ButtonMenuItem,
    DropdownMenu,
    getValueFromArtificialEvent,
    getValueFromEvent,
    iconExpandDown,
    Label,
    LabelController,
  } from '@mathesar/component-library';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { iconSetToNull } from '@mathesar/icons';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import type RecordStore from './RecordStore';

  const labelController = new LabelController();

  export let processedColumn: ProcessedColumn;
  export let record: RecordStore;

  let isUpdating = false;

  $: ({ column } = processedColumn);
  $: ({ fields, recordSummaries } = record);
  $: value = $fields.get(column.id);
  $: disabled = column.primary_key || isUpdating;

  async function updateField(v: unknown) {
    isUpdating = true;
    try {
      await record.updateField(column.id, v);
    } catch (e) {
      toast.error(getErrorMessage(e));
    } finally {
      isUpdating = false;
    }
  }
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
      {value}
      {disabled}
      componentAndProps={processedColumn.inputComponentAndProps}
      {labelController}
      on:change={(e) => updateField(getValueFromEvent(e))}
      on:artificialChange={(e) => updateField(getValueFromArtificialEvent(e))}
      recordSummary={$recordSummaries
        .get(String(column.id))
        ?.get(String(value))}
      setRecordSummary={(recordId, recordSummary) =>
        recordSummaries.addBespokeRecordSummary({
          columnId: String(column.id),
          recordId,
          recordSummary,
        })}
    />
  </div>
</div>

<style>
  .direct-field {
    display: contents;
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
