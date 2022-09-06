<script lang="ts">
  import {
    getValueFromArtificialEvent,
    getValueFromEvent,
    LabeledInput,
  } from '@mathesar/component-library';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import TableColumnName from '@mathesar/components/TableColumnName.svelte';
  import type { ProcessedColumn } from '@mathesar/stores/table-data/processedColumns';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import type RecordStore from './RecordStore';

  export let processedColumn: ProcessedColumn;
  export let record: RecordStore;

  let isUpdating = false;

  $: ({ column } = processedColumn);
  $: ({ fields } = record);
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

<LabeledInput layout="stacked">
  <TableColumnName column={processedColumn} slot="label" />
  <DynamicInput
    {value}
    {disabled}
    componentAndProps={processedColumn.inputComponentAndProps}
    on:change={(e) => updateField(getValueFromEvent(e))}
    on:artificialChange={(e) => updateField(getValueFromArtificialEvent(e))}
  />
</LabeledInput>
