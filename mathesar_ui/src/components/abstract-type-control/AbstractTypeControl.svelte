<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    createValidationContext,
    CancelOrProceedButtonPair,
  } from '@mathesar-component-library';
  import { toast } from '@mathesar/stores/toast';
  import type { RequestStatus } from '@mathesar/utils/api';
  import type {
    ColumnWithAbstractType,
    ColumnTypeOptionsSaveArgs,
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
  let typeChangeState: RequestStatus;
  let actionButtonsVisible = false;

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
    actionButtonsVisible = false;
    dispatch('cancel');
  }

  async function onSave() {
    typeChangeState = { state: 'processing' };
    try {
      await save({
        type: selectedDbType,
        type_options: { ...typeOptions },
      });
      console.log('save successful');
      actionButtonsVisible = false;
    } catch (err) {
      const errorMessage =
        err instanceof Error ? err.message : 'Unable to change column type';
      toast.error(errorMessage);
    }
  }

  $: isSaveDisabled =
    !selectedAbstractType ||
    typeChangeState?.state === 'processing' ||
    !$validationResult;

  function showActionButtons() {
    actionButtonsVisible = true;
  }
</script>

<div
  class="column-type-menu"
  on:focus={showActionButtons}
  on:mousedown={showActionButtons}
>
  <AbstractTypeSelector
    {selectedAbstractType}
    {column}
    on:change={(e) => selectTypeAndAbstractType(e.detail)}
    on:reset={() => resetAbstractType(column)}
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
</div>

<style lang="scss">
  .footer {
    margin-top: 1rem;
  }
</style>
