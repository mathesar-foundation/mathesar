<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    createValidationContext,
    CancelOrProceedButtonPair,
  } from '@mathesar-component-library';
  import { toast } from '@mathesar/stores/toast';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import type {
    ColumnWithAbstractType,
    ColumnTypeOptionsSaveArgs,
  } from './utils';
  import AbstractTypeOptions from './AbstractTypeOptions.svelte';
  import AbstractTypeSelector from './AbstractTypeSelector.svelte';

  const dispatch = createEventDispatcher();

  export let column: ColumnWithAbstractType;
  export let save: (options: ColumnTypeOptionsSaveArgs) => Promise<unknown>;

  let selectedAbstractType: ColumnWithAbstractType['abstractType'] =
    column.abstractType;
  let selectedDbType: ColumnWithAbstractType['type'] = column.type;
  let typeOptions: ColumnWithAbstractType['type_options'] = {
    ...(column.type_options ?? {}),
  };
  let displayOptions: ColumnWithAbstractType['display_options'] = {
    ...(column.display_options ?? {}),
  };
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
    displayOptions = { ...(_column.display_options ?? {}) };
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
    displayOptions = {};
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
        display_options: { ...displayOptions },
      });
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
</script>

<div class="column-type-menu">
  <AbstractTypeSelector
    {selectedAbstractType}
    {column}
    on:change={(e) => selectTypeAndAbstractType(e.detail)}
    on:reset={() => resetAbstractType(column)}
  />

  {#if selectedAbstractType && selectedDbType}
    {#key selectedAbstractType}
      <AbstractTypeOptions
        {selectedAbstractType}
        bind:selectedDbType
        bind:typeOptions
        bind:displayOptions
        {column}
      />
    {/key}
  {/if}

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
</div>

<style lang="scss">
  .column-type-menu {
    padding: 0.75rem;

    .footer {
      margin-top: 1rem;
    }
  }
</style>
