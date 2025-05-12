<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RequestStatus } from '@mathesar/api/rest/utils/requestUtils';
  import type { ColumnMetadata } from '@mathesar/api/rpc/_common/columnDisplayOptions';
  import { createValidationContext } from '@mathesar/component-library';
  import CancelOrProceedButtonPair from '@mathesar/component-library/cancel-or-proceed-button-pair/CancelOrProceedButtonPair.svelte';
  import AbstractTypeDisplayOptions from '@mathesar/components/abstract-type-control/AbstractTypeDisplayOptions.svelte';
  import { constructDisplayForm } from '@mathesar/components/abstract-type-control/utils';
  import type { CellColumnFabric } from '@mathesar/components/cell-fabric/types';
  import { toast } from '@mathesar/stores/toast';

  const validationContext = createValidationContext();

  export let column: CellColumnFabric;
  export let onSave: (columnMetadata: ColumnMetadata) => Promise<void>;

  let actionButtonsVisible = false;
  let displayOptions: ColumnMetadata = column.column.metadata ?? {};
  let typeChangeState: RequestStatus;

  $: ({ validationResult } = validationContext);
  $: ({ displayOptionsConfig, displayForm, displayFormValues } =
    constructDisplayForm(column.abstractType, column.column.metadata ?? {}));
  $: isSaveDisabled =
    typeChangeState?.state === 'processing' || !$validationResult;
  $: isFormDisabled = typeChangeState?.state === 'processing';

  // TODO_EXPLORATION_DISPLAY_IMPROVEMENTS: Re-enable this line once
  // `QueryResultColumn` contains the necessary data from the API.
  //
  // $: isFkOrPk = column.column.primary_key || !!column.linkFk;
  $: isFkOrPk = false;

  async function handleProceed() {
    typeChangeState = { state: 'processing' };
    try {
      await onSave(displayOptions);
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
      constructDisplayForm(column.abstractType, column.column.metadata ?? {}));
  }

  function showActionButtons() {
    actionButtonsVisible = true;
  }
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
          onProceed={handleProceed}
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
