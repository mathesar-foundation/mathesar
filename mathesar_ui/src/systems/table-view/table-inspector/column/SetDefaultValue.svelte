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
  export let canExecuteDDL: boolean;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore, recordsData } = $tabularData);
  $: ({ recordSummaries } = recordsData);

  $: initialValue = column.column.default?.value ?? column.initialInputValue;
  $: value = initialValue;
  $: actionButtonsVisible = (() => {
    if (typeof value === 'object') {
      return JSON.stringify(value) !== JSON.stringify(initialValue);
    }
      return String(value) !== String(initialValue);
  })();

  $: recordSummary = $recordSummaries
    .get(String(column.id))
    ?.get(String(value));

  let typeChangeState: RequestStatus;

  function resetValue() {
    value = initialValue;
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

  $: disabled = !canExecuteDDL || typeChangeState?.state === 'processing';
</script>

<div class="default-value-container">
  <span class="label">Value</span>
  <DynamicInput
    componentAndProps={column.inputComponentAndProps}
    bind:value
    {disabled}
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
