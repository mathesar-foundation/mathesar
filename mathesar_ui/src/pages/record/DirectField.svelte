<script lang="ts">
  import {
    getValueFromArtificialEvent,
    getValueFromEvent,
    LabeledInput,
  } from '@mathesar/component-library';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import type { ProcessedColumn } from '@mathesar/stores/table-data/processedColumns';
  import { buildDataForRecordSummaryInFkCell } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import type RecordStore from './RecordStore';

  export let processedColumn: ProcessedColumn;
  export let record: RecordStore;

  let isUpdating = false;

  $: ({ column } = processedColumn);
  $: ({ fields, dataForRecordSummariesInFkColumns } = record);
  $: value = $fields.get(column.id);
  $: disabled = column.primary_key || isUpdating;
  $: dataForRecordSummaryInFkCell = buildDataForRecordSummaryInFkCell({
    recordId: String(value),
    stringifiedColumnId: String(column.id),
    dataForRecordSummariesInFkColumns: $dataForRecordSummariesInFkColumns,
  });

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
  <ProcessedColumnName {processedColumn} slot="label" />
  <DynamicInput
    {value}
    {disabled}
    componentAndProps={processedColumn.inputComponentAndProps}
    on:change={(e) => updateField(getValueFromEvent(e))}
    on:artificialChange={(e) => updateField(getValueFromArtificialEvent(e))}
    {dataForRecordSummaryInFkCell}
  />
</LabeledInput>
