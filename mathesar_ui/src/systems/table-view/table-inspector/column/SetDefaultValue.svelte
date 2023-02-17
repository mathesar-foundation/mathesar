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

  $: initialValue = column.column.default?.value;
  $: value = initialValue;

  /**
   * `value` is being passed to different types
   * of input components by the `DynamicInput` component.
   * All components when passed `value={undefined}` let it be undefined
   * but input and textarea change it to empty string
   * which makes the check `value===initialValue` to fail
   * hence the sanitization.
   */
  $: sanitizedValue = value === '' ? undefined : value;

  /**
   * Not using strict equality here since
   * numbers are being sent as string to the backend
   * but the initialValue from BE is always of the
   * correct data type.
   */
  $: actionButtonsVisible = sanitizedValue != initialValue;

  $: console.log({
    sanitizedValue,
    value,
    initialValue,
  });

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
