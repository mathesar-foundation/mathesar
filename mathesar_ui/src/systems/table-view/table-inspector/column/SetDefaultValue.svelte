<script lang="ts">
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import { CancelOrProceedButtonPair } from '@mathesar/component-library';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import {
    getTabularDataStoreFromContext,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';

  export let column: ProcessedColumn;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore, recordsData } = $tabularData);
  $: ({ recordSummaries } = recordsData);

  $: value = column.column.default?.value;
  $: actionButtonsVisible = value !== column.column.default?.value;
  $: recordSummary = $recordSummaries
    .get(String(column.id))
    ?.get(String(value));

  let typeChangeState: RequestStatus;

  function resetValue() {
    value = column.column.default?.value;
  }

  async function save() {
    typeChangeState = { state: 'processing' };
    try {
      await columnsDataStore.patch(column.id, {
        default: {
          is_dynamic: !!column.column.default?.is_dynamic,
          value,
        },
      });
      typeChangeState = { state: 'success' };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : 'Unable to change column display options.';
      toast.error(message);
      typeChangeState = { state: 'failure', errors: [message] };
    }
  }

  function handleCancel() {
    resetValue();
    typeChangeState = { state: 'success' };
  }

  function setRecordSummary(recordId: string, _recordSummary: string) {
    if (recordSummaries) {
      recordSummaries.addBespokeRecordSummary({
        columnId: String(column.id),
        recordId,
        recordSummary: _recordSummary,
      });
    }
  }
</script>

<div class="default-value-container">
  <span class="label">Value</span>
  <DynamicInput
    componentAndProps={column.inputComponentAndProps}
    bind:value
    disabled={typeChangeState?.state === 'processing'}
    {recordSummary}
    {setRecordSummary}
  />
  {#if actionButtonsVisible}
    <CancelOrProceedButtonPair
      onProceed={save}
      onCancel={handleCancel}
      isProcessing={typeChangeState?.state === 'processing'}
      proceedButton={{ label: 'Save' }}
      size="small"
    />
  {/if}
</div>

<style lang="scss">
  .default-value-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }
  }
</style>
