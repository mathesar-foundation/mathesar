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
    Help,
    LabeledInput,
    Radio,
  } from '@mathesar-component-library';

  import {
    type DefaultValueMode,
    getDefaultValueOptions,
  } from './defaultValueOptions';

  export let column: ProcessedColumn;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ table, columnsDataStore, recordsData } = $tabularData);
  $: ({ linkedRecordSummaries } = recordsData);
  $: ({ currentRoleOwns } = table.currentAccess);

  // Get type-specific default value options
  $: options = getDefaultValueOptions(column);
  $: initialDefaultMode = options.initialMode;

  $: initialValue = column.column.default?.value ?? column.initialInputValue;

  // Track column ID to reset when column changes
  let previousColumnId = column.id;
  let defaultMode: DefaultValueMode;
  let value = initialValue;

  // Initialize and reset when column changes
  $: {
    if (column.id !== previousColumnId || defaultMode === undefined) {
      previousColumnId = column.id;
      defaultMode = initialDefaultMode;
      value = initialValue;
    }
  }

  $: isDefaultNull = defaultMode === 'none';
  $: isAutoSetEditor = defaultMode === 'auto_set_editor';
  $: isSetDefaultUser =
    defaultMode === 'set_default_user' || defaultMode === 'custom';

  $: actionButtonsVisible = (() => {
    if (defaultMode !== initialDefaultMode) {
      return true;
    }
    if (isSetDefaultUser) {
      if (initialDefaultMode === 'none') {
        return true;
      }
      if (typeof value === 'object') {
        return JSON.stringify(value) !== JSON.stringify(initialValue);
      }
      return String(value) !== String(initialValue);
    }
    return false;
  })();

  $: recordSummary = $linkedRecordSummaries
    .get(String(column.id))
    ?.get(String(value));

  let typeChangeState: RequestStatus;

  function resetValue() {
    defaultMode = initialDefaultMode;
    value = initialValue;
  }

  async function save() {
    typeChangeState = { state: 'processing' };
    try {
      // Update default value
      const defaultRequest =
        isDefaultNull || isAutoSetEditor
          ? null
          : {
              // For user type columns, the default is always static (a user ID)
              // For other types, preserve existing is_dynamic setting
              is_dynamic:
                defaultMode === 'set_default_user'
                  ? false
                  : !!column.column.default?.is_dynamic,
              value: String(value),
            };
      await columnsDataStore.patch({
        id: column.column.id,
        default: defaultRequest,
      });

      // Update metadata if this column type supports it
      if (options.supportsMetadataUpdate && options.getMetadataUpdate) {
        const metadataUpdate = options.getMetadataUpdate(defaultMode);
        if (metadataUpdate) {
          const currentMetadata = column.column.metadata ?? {};
          await columnsDataStore.setDisplayOptions(
            new Map([
              [
                column.column.id,
                {
                  ...currentMetadata,
                  ...metadataUpdate,
                },
              ],
            ]),
          );
        }
      }

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

  function setDefaultMode(mode: DefaultValueMode) {
    defaultMode = mode;
  }

  function setRecordSummary(recordId: string, _recordSummary: string) {
    if (linkedRecordSummaries) {
      linkedRecordSummaries.addBespokeValue({
        columnId: String(column.id),
        key: recordId,
        value: _recordSummary,
      });
    }
  }

  $: disabled = typeChangeState?.state === 'processing' || !$currentRoleOwns;
</script>

<div class="default-value-container">
  <LabeledInput layout="inline-input-first">
    <span slot="label">{$_('no_default_value')}</span>
    <Radio
      checked={isDefaultNull}
      on:change={() => setDefaultMode('none')}
      {disabled}
    />
  </LabeledInput>
  {#if options.availableModes.includes('auto_set_editor')}
    <LabeledInput layout="inline-input-first">
      <span slot="label">
        {$_('default_value_auto_set_editor')}
        <Help>{$_('default_value_auto_set_editor_help')}</Help>
      </span>
      <Radio
        checked={isAutoSetEditor}
        on:change={() => setDefaultMode('auto_set_editor')}
        {disabled}
      />
    </LabeledInput>
  {/if}
  {#if options.availableModes.includes('set_default_user')}
    <LabeledInput layout="inline-input-first">
      <span slot="label">{$_(options.customValueLabel)}</span>
      <Radio
        checked={isSetDefaultUser}
        on:change={() => setDefaultMode('set_default_user')}
        {disabled}
      />
    </LabeledInput>
  {:else if options.availableModes.includes('custom')}
    <LabeledInput layout="inline-input-first">
      <span slot="label">{$_(options.customValueLabel)}</span>
      <Radio
        checked={isSetDefaultUser}
        on:change={() => setDefaultMode('custom')}
        {disabled}
      />
    </LabeledInput>
  {/if}
  {#if isSetDefaultUser}
    <DynamicInput
      componentAndProps={column.simpleInputComponentAndProps}
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
