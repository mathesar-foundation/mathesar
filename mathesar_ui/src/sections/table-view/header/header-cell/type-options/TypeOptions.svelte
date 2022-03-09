<script lang="ts">
  import { createEventDispatcher, getContext, tick, onMount } from 'svelte';
  import { faDatabase } from '@fortawesome/free-solid-svg-icons';
  import {
    Button,
    Icon,
    Spinner,
    createValidationContext,
  } from '@mathesar-component-library';
  import {
    currentDbAbstractTypes,
    getAbstractTypesForDbTypeList,
  } from '@mathesar/stores/abstract-types';
  import { States } from '@mathesar/utils/api';
  import { toast } from '@mathesar/stores/toast';

  import type { DbType } from '@mathesar/App.d';
  import type {
    Column,
    TabularDataStore,
  } from '@mathesar/stores/table-data/types';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';

  import DatabaseOptions from './database-options/DatabaseOptions.svelte';

  const dispatch = createEventDispatcher();

  const tabularData = getContext<TabularDataStore>('tabularData');
  $: ({ columnsDataStore } = $tabularData);

  export let column: Column;
  export let abstractTypeOfColumn: AbstractType | undefined;

  $: allowedTypeConversions = getAbstractTypesForDbTypeList(
    [...(column.valid_target_types || []), column.type],
    $currentDbAbstractTypes.data,
  );

  let abstractTypeContainer: HTMLUListElement;
  let selectedAbstractType: AbstractType | undefined;
  let selectedDbType: DbType | undefined;
  let typeOptions: Column['type_options'];
  let typeChangeState = States.Idle;

  const validationContext = createValidationContext();
  $: ({ validationResult } = validationContext);

  onMount(() => {
    validationContext.validate();
  });

  function selectAbstractType(abstractType: AbstractType) {
    if (selectedAbstractType !== abstractType) {
      if (abstractType.identifier === abstractTypeOfColumn?.identifier) {
        selectedDbType = column.type;
        typeOptions = column.type_options;
      } else if (abstractType.defaultDbType) {
        selectedDbType = abstractType.defaultDbType;
        typeOptions = null;
      } else if (abstractType.dbTypes.size > 0) {
        [selectedDbType] = abstractType.dbTypes;
        typeOptions = null;
      }
      selectedAbstractType = abstractType;
    }
  }

  function resetAbstractType() {
    selectedDbType = column.type;
    typeOptions = column.type_options;
    selectedAbstractType = abstractTypeOfColumn;
  }

  async function scrollToSelectedType() {
    await tick();
    const selectedElement: HTMLLIElement | null =
      abstractTypeContainer?.querySelector('li.selected');
    if (selectedElement) {
      abstractTypeContainer.scrollTop = selectedElement.offsetTop;
    }
  }

  $: if (!selectedAbstractType && abstractTypeOfColumn) {
    resetAbstractType();
    void scrollToSelectedType();
  }

  function close() {
    resetAbstractType();
    typeChangeState = States.Done;
    dispatch('close');
  }

  async function onSave() {
    typeChangeState = States.Loading;
    try {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call
      await columnsDataStore.patchType(column.id, selectedDbType, typeOptions);
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
  <ul bind:this={abstractTypeContainer} class="type-list">
    {#each allowedTypeConversions as abstractType (abstractType.identifier)}
      <li
        class:selected={selectedAbstractType?.identifier ===
          abstractType?.identifier}
      >
        <Button
          appearance="plain"
          on:click={() => selectAbstractType(abstractType)}
        >
          <span class="data-icon">{abstractType.icon}</span>
          <span>{abstractType.name}</span>
        </Button>
      </li>
    {/each}
  </ul>

  <div class="type-options">
    <!-- TODO: Make tab container more generic to be used here -->
    <ul class="type-option-tabs">
      <li>
        <Button appearance="ghost" class="padding-zero type-option-tab">
          <Icon size="0.75em" data={faDatabase} />
          <span>Database</span>
        </Button>
      </li>
    </ul>
    <div class="type-options-content">
      {#if selectedDbType}
        <DatabaseOptions
          bind:selectedDbType
          bind:typeOptions
          {column}
          {selectedAbstractType}
        />
      {/if}
    </div>
  </div>

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
  @import 'TypeOptions.scss';
</style>
