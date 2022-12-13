<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    createValidationContext,
    CancelOrProceedButtonPair,
    Alert,
  } from '@mathesar-component-library';
  import { toast } from '@mathesar/stores/toast';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import {
    type ColumnWithAbstractType,
    type ColumnTypeOptionsSaveArgs,
    hasTypeOptionsChanged,
  } from './utils';
  import AbstractTypeDBOptions from './AbstractTypeDBOptions.svelte';
  import AbstractTypeSelector from './AbstractTypeSelector.svelte';

  const dispatch = createEventDispatcher();

  export let column: ColumnWithAbstractType;
  export let save: (
    options: Pick<ColumnTypeOptionsSaveArgs, 'type' | 'type_options'>,
  ) => Promise<unknown>;

  let selectedAbstractType: ColumnWithAbstractType['abstractType'] =
    column.abstractType;
  let selectedDbType: ColumnWithAbstractType['type'] = column.type;
  let typeOptions: ColumnWithAbstractType['type_options'] = {
    ...(column.type_options ?? {}),
  };
  $: actionButtonsVisible =
    selectedAbstractType !== column.abstractType ||
    selectedDbType !== column.type ||
    hasTypeOptionsChanged(column.type_options ?? {}, typeOptions ?? {});

  let typeChangeState: RequestStatus;

  const validationContext = createValidationContext();
  $: ({ validationResult } = validationContext);

  onMount(() => {
    validationContext.validate();
  });

  function resetAbstractType(_column: ColumnWithAbstractType) {
    selectedAbstractType = _column.abstractType;
    selectedDbType = _column.type;
    typeOptions = { ...(_column.type_options ?? {}) };
  }
  $: resetAbstractType(column);

  function selectTypeAndAbstractType(typeInfo: {
    type: ColumnWithAbstractType['type'];
    abstractType: ColumnWithAbstractType['abstractType'];
  }) {
    const { type, abstractType } = typeInfo;
    selectedDbType = type;
    selectedAbstractType = abstractType;
    typeOptions = {};
  }

  function cancel() {
    resetAbstractType(column);
    typeChangeState = { state: 'success' };
    dispatch('cancel');
  }

  async function onSave() {
    typeChangeState = { state: 'processing' };
    try {
      await save({
        type: selectedDbType,
        type_options: { ...typeOptions },
      });
      typeChangeState = { state: 'success' };
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to change column type';
      toast.error(errorMessage);
      typeChangeState = { state: 'failure', errors: [errorMessage] };
    }
  }

  $: isSaveDisabled =
    !selectedAbstractType ||
    typeChangeState?.state === 'processing' ||
    !$validationResult;
</script>

<AbstractTypeSelector
  {selectedAbstractType}
  {column}
  on:change={(e) => selectTypeAndAbstractType(e.detail)}
  on:reset={() => resetAbstractType(column)}
  disabled={typeChangeState?.state === 'processing'}
/>

{#if selectedAbstractType && selectedDbType}
  {#key selectedAbstractType}
    <AbstractTypeDBOptions
      {selectedAbstractType}
      bind:selectedDbType
      bind:typeOptions
      {column}
    />
  {/key}
{/if}

{#if actionButtonsVisible}
  <div class="footer">
    <Alert appearance="warning">
      <span class="warning-alert">
        Data loss can result from changing the data type of a column. This
        action cannot be undone.
      </span>
    </Alert>
    <CancelOrProceedButtonPair
      onProceed={onSave}
      onCancel={cancel}
      isProcessing={typeChangeState?.state === 'processing'}
      canProceed={!isSaveDisabled}
      proceedButton={{ label: 'Save' }}
      size="small"
    />
  </div>
{/if}

<style lang="scss">
  .footer {
    margin-top: 1rem;

    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 0.5rem;
    }

    .warning-alert {
      font-size: var(--text-size-small);
    }
  }
</style>
