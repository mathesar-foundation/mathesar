<script lang="ts">
  import { _ } from 'svelte-i18n';

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
  export let initialDisplayOptions: ColumnMetadata;

  let actionButtonsVisible = false;
  let isProcessing = false;
  let displayOptions: ColumnMetadata;

  $: displayOptions = initialDisplayOptions;
  $: ({ validationResult } = validationContext);
  $: ({ displayOptionsConfig, displayForm, displayFormValues } =
    constructDisplayForm(column.abstractType, initialDisplayOptions));
  $: isSaveDisabled = isProcessing || !$validationResult;
  $: isFormDisabled = isProcessing;

  // TODO_EXPLORATION_DISPLAY_IMPROVEMENTS: Re-enable this line once
  // `QueryResultColumn` contains the necessary data from the API.
  //
  // $: isFkOrPk = column.column.primary_key || !!column.linkFk;
  $: isFkOrPk = false;

  async function handleProceed() {
    isProcessing = true;
    try {
      await onSave(displayOptions);
      actionButtonsVisible = false;
      isProcessing = false;
    } catch (err) {
      const message =
        err instanceof Error
          ? err.message
          : $_('unable_to_change_display_opts');
      toast.error(message);
      isProcessing = true;
    }
  }

  function cancel() {
    isProcessing = false;
    displayOptions = initialDisplayOptions;
    actionButtonsVisible = false;
    ({ displayOptionsConfig, displayForm, displayFormValues } =
      constructDisplayForm(column.abstractType, initialDisplayOptions));
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
          {isProcessing}
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
