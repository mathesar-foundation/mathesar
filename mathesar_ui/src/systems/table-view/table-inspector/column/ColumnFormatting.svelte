<script lang="ts">
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import { createValidationContext } from '@mathesar/component-library';
  import CancelOrProceedButtonPair from '@mathesar/component-library/cancel-or-proceed-button-pair/CancelOrProceedButtonPair.svelte';
  import AbstractTypeDisplayOptions from '@mathesar/components/abstract-type-control/AbstractTypeDisplayOptions.svelte';
  import type { ColumnWithAbstractType } from '@mathesar/components/abstract-type-control/types';
  import { constructDisplayForm } from '@mathesar/components/abstract-type-control/utils';
  import {
    getTabularDataStoreFromContext,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';

  export let column: ProcessedColumn;

  let actionButtonsVisible = false;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);

  let displayOptions: ColumnWithAbstractType['display_options'] = {
    ...(column.column.display_options ?? {}),
  };
  let typeChangeState: RequestStatus;

  const validationContext = createValidationContext();
  $: ({ validationResult } = validationContext);

  $: ({ displayOptionsConfig, displayForm, displayFormValues } =
    constructDisplayForm(column.abstractType, column.column.type, {
      ...column.column,
      abstractType: column.abstractType,
    }));

  async function save() {
    typeChangeState = { state: 'processing' };
    try {
      await columnsDataStore.patch(column.id, {
        display_options: displayOptions,
      });
      actionButtonsVisible = false;
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

  function cancel() {
    typeChangeState = { state: 'success' };
    displayOptions = {};
    actionButtonsVisible = false;
  }

  $: isSaveDisabled =
    typeChangeState?.state === 'processing' || !$validationResult;

  function showActionButtons() {
    actionButtonsVisible = true;
  }

  $: isFkOrPk = column.column.primary_key || !!column.linkFk;
</script>

{#if displayOptionsConfig && displayForm && !isFkOrPk}
  <div on:focus={showActionButtons} on:mousedown={showActionButtons}>
    <AbstractTypeDisplayOptions
      bind:displayOptions
      {displayOptionsConfig}
      {displayForm}
      {displayFormValues}
    />

    {#if actionButtonsVisible}
      <div class="footer">
        <CancelOrProceedButtonPair
          onProceed={save}
          onCancel={cancel}
          isProcessing={typeChangeState?.state === 'processing'}
          canProceed={!isSaveDisabled}
          proceedButton={{ label: 'Save' }}
          size="small"
        />
      </div>
    {/if}
  </div>
{:else}
  <span>No formatting option for the column data type</span>
{/if}

<style lang="scss">
  .footer {
    margin-top: 1rem;
  }
</style>
