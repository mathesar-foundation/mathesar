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
  import type { Column } from '@mathesar/stores/table-data/types';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';

  import AbstractTypeOptions from './AbstractTypeOptions.svelte';
  import AbstractTypeSelector from './AbstractTypeSelector.svelte';

  const dispatch = createEventDispatcher();

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);

  export let column: Column;
  export let abstractTypeOfColumn: AbstractType | undefined;

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

  function resetAbstractType() {
    selectedDbType = column.type;
    typeOptions = { ...(column.type_options ?? {}) };
    displayOptions = { ...(column.display_options ?? {}) };
    defaultValue = column.default ? { ...column.default } : null;
    selectedAbstractType = abstractTypeOfColumn;
  }
  resetAbstractType();

  function clearTypeRelatedOptions() {
    typeOptions = {};
    displayOptions = {};
    defaultValue = null;
  }

  function selectAbstractType(abstractType: AbstractType) {
    if (selectedAbstractType !== abstractType) {
      if (abstractType.identifier === abstractTypeOfColumn?.identifier) {
        resetAbstractType();
      } else if (abstractType.defaultDbType) {
        selectedDbType = abstractType.defaultDbType;
        clearTypeRelatedOptions();
      } else if (abstractType.dbTypes.size > 0) {
        [selectedDbType] = abstractType.dbTypes;
        clearTypeRelatedOptions();
      }
      selectedAbstractType = abstractType;
    }
  }

  function close() {
    resetAbstractType();
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
        {column}
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
