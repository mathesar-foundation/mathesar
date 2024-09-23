<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
  import type { ColumnMetadata } from '@mathesar/api/rpc/columns';
  import { createValidationContext } from '@mathesar/component-library';
  import CancelOrProceedButtonPair from '@mathesar/component-library/cancel-or-proceed-button-pair/CancelOrProceedButtonPair.svelte';
  import AbstractTypeDisplayOptions from '@mathesar/components/abstract-type-control/AbstractTypeDisplayOptions.svelte';
  import { constructDisplayForm } from '@mathesar/components/abstract-type-control/utils';
  import {
    type ProcessedColumn,
    getTabularDataStoreFromContext,
  } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';

  export let column: ProcessedColumn;

  let actionButtonsVisible = false;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);

  let displayOptions: ColumnMetadata = column.column.metadata ?? {};
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
      await columnsDataStore.setDisplayOptions(column, displayOptions);
      actionButtonsVisible = false;
      typeChangeState = { state: 'success' };
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : $_('unable_to_change_display_opts');
      toast.error(message);
      typeChangeState = { state: 'failure', errors: [message] };
    }
  }

  function cancel() {
    typeChangeState = { state: 'success' };
    displayOptions = column.column.metadata ?? {};
    actionButtonsVisible = false;
    ({ displayOptionsConfig, displayForm, displayFormValues } =
      constructDisplayForm(column.abstractType, column.column.type, {
        ...column.column,
        abstractType: column.abstractType,
      }));
  }

  $: isSaveDisabled =
    typeChangeState?.state === 'processing' || !$validationResult;

  function showActionButtons() {
    actionButtonsVisible = true;
  }

  $: isFkOrPk = column.column.primary_key || !!column.linkFk;
  $: isFormDisabled = typeChangeState?.state === 'processing';
</script>

{#if displayOptionsConfig && displayForm && !isFkOrPk}
  <div on:focus={showActionButtons} on:mousedown={showActionButtons}>
    <AbstractTypeDisplayOptions
      bind:displayOptions
      {displayOptionsConfig}
      {displayForm}
      {displayFormValues}
      disabled={isFormDisabled}
    />

    {#if actionButtonsVisible}
      <div class="footer">
        <CancelOrProceedButtonPair
          onProceed={save}
          onCancel={cancel}
          isProcessing={typeChangeState?.state === 'processing'}
          canProceed={!isSaveDisabled}
          proceedButton={{ label: $_('save') }}
          size="small"
        />
      </div>
    {/if}
  </div>
{:else}
  <span>{$_('no_formatting_option_data_type')}</span>
{/if}

<style lang="scss">
  .footer {
    margin-top: 1rem;
  }
</style>
