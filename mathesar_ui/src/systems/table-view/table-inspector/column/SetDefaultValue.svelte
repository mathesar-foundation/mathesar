<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import {
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import {
    CancelOrProceedButtonPair,
    LabeledInput,
    Radio,
  } from '@mathesar-component-library';

  export let column: ProcessedColumn;
  export let canExecuteDDL: boolean;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore, recordsData } = $tabularData);
  $: ({ recordSummaries } = recordsData);

  $: initialValue = column.column.default?.value ?? column.initialInputValue;
  $: value = initialValue;
  $: isDefaultNull = column.column.default === null;
  $: actionButtonsVisible = (() => {
    if (isDefaultNull) {
      return column.column.default !== null;
    }
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
    const defaultRequest = isDefaultNull
      ? null
      : {
          is_dynamic: !!column.column.default?.is_dynamic,
          value,
        };
    try {
      await columnsDataStore.patch(column.id, {
        default: defaultRequest,
      });
      typeChangeState = { state: 'success' };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : $_('unable_to_change_display_options');
      toast.error(message);
      typeChangeState = { state: 'failure', errors: [message] };
    }
  }

  function handleCancel() {
    resetValue();
    typeChangeState = { state: 'success' };
  }

  function toggleNoDefault() {
    isDefaultNull = !isDefaultNull;
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
  <LabeledInput layout="inline-input-first">
    <span slot="label">{$_('no_default_value')}</span>
    <Radio checked={isDefaultNull} on:change={toggleNoDefault} />
  </LabeledInput>
  <LabeledInput layout="inline-input-first">
    <span slot="label">{$_('custom_default')}</span>
    <Radio checked={!isDefaultNull} on:change={toggleNoDefault} />
  </LabeledInput>
  {#if !isDefaultNull}
    <DynamicInput
      componentAndProps={column.inputComponentAndProps}
      bind:value
      {disabled}
      {recordSummary}
      {setRecordSummary}
    />
  {/if}
  {#if actionButtonsVisible}
    <CancelOrProceedButtonPair
      onProceed={save}
      onCancel={handleCancel}
      isProcessing={typeChangeState?.state === 'processing'}
      proceedButton={{ label: $_('save') }}
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
