<script lang="ts">
  import { createEventDispatcher, onMount } from 'svelte';
  import {
    Button,
    Spinner,
    createValidationContext,
  } from '@mathesar-component-library';
  import { States } from '@mathesar/utils/api';
  import { toast } from '@mathesar/stores/toast';

  import type { DbType } from '@mathesar/AppTypes';
  import type { Column } from '@mathesar/api/tables/columns';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import type { ProcessedColumn } from '@mathesar/stores/table-data/types';

  import AbstractTypeOptions from './AbstractTypeOptions.svelte';
  import AbstractTypeSelector from './AbstractTypeSelector.svelte';

  const dispatch = createEventDispatcher();

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);

  export let processedColumn: ProcessedColumn;
  export let abstractType: AbstractType | undefined;

  $: ({ column } = processedColumn);

  let selectedAbstractType: AbstractType | undefined;
  let selectedDbType: DbType | undefined;
  let typeOptions: Column['type_options'];
  let displayOptions: Column['display_options'];
  let defaultValue: Column['default'];
  let typeChangeState = States.Idle;

  const validationContext = createValidationContext();
  $: ({ validationResult } = validationContext);

  onMount(() => {
    validationContext.validate();
  });

  function resetAbstractType(_column: Column) {
    selectedAbstractType = abstractType;
    selectedDbType = _column.type;
    typeOptions = { ...(_column.type_options ?? {}) };
    displayOptions = { ...(_column.display_options ?? {}) };
    defaultValue = _column.default ? { ..._column.default } : null;
  }
  $: resetAbstractType(column);

  function clearTypeRelatedOptions() {
    typeOptions = {};
    displayOptions = {};
    defaultValue = null;
  }

  function selectAbstractType(newAbstractType: AbstractType) {
    if (selectedAbstractType !== newAbstractType) {
      if (newAbstractType.identifier === abstractType?.identifier) {
        resetAbstractType(column);
      } else if (newAbstractType.defaultDbType) {
        selectedDbType = newAbstractType.defaultDbType;
        clearTypeRelatedOptions();
      } else if (newAbstractType.dbTypes.size > 0) {
        [selectedDbType] = newAbstractType.dbTypes;
        clearTypeRelatedOptions();
      }
      selectedAbstractType = newAbstractType;
    }
  }

  function close() {
    resetAbstractType(column);
    typeChangeState = States.Done;
    dispatch('close');
  }

  async function onSave() {
    typeChangeState = States.Loading;
    try {
      if (selectedDbType) {
        await columnsDataStore.patch(column.id, {
          type: selectedDbType,
          type_options: typeOptions,
          display_options: displayOptions,
          default: defaultValue?.is_dynamic ? undefined : defaultValue,
        });
      }
    } catch (err) {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      toast.error(`Unable to change column type. ${err.message as string}`);
    }
    close();
  }

  $: isSaveDisabled =
    !selectedAbstractType ||
    typeChangeState === States.Loading ||
    !$validationResult;
</script>

<div class="column-type-menu">
  <h5 class="menu-header">Set Column Type</h5>
  <AbstractTypeSelector
    {selectedAbstractType}
    {column}
    on:selection={(e) => selectAbstractType(e.detail)}
  />

  {#if selectedAbstractType && selectedDbType}
    {#key selectedAbstractType}
      <AbstractTypeOptions
        {selectedAbstractType}
        bind:selectedDbType
        bind:typeOptions
        bind:displayOptions
        bind:defaultValue
        {processedColumn}
      />
    {/key}
  {/if}

  <div class="divider" />
  <div class="type-menu-footer">
    <Button appearance="primary" disabled={isSaveDisabled} on:click={onSave}>
      {#if typeChangeState === States.Loading}
        <Spinner />
      {/if}
      <span>Save</span>
    </Button>
    <Button appearance="default" on:click={close}>Close</Button>
  </div>
</div>

<style global lang="scss">
  @import 'AbstractTypeConfiguration.scss';
</style>
