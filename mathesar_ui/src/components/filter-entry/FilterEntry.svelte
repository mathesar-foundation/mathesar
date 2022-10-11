<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import {
    InputGroup,
    Icon,
    Button,
    Select,
  } from '@mathesar-component-library';
  import type { ComponentAndProps } from '@mathesar-component-library/types';
  import type { AbstractTypeFilterDefinition } from '@mathesar/stores/abstract-types/types';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import { getDbTypeBasedInputCap } from '@mathesar/components/cell-fabric/utils';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { FilterEntryColumnLike } from './types';
  import { validateFilterEntry } from './utils';

  type T = $$Generic;
  type ColumnLikeType = FilterEntryColumnLike & T;

  const dispatch = createEventDispatcher();
  const tabularData = getTabularDataStoreFromContext();

  export let columns: ColumnLikeType[];
  export let getColumnLabel: (column: ColumnLikeType) => string;

  export let columnIdentifier: ColumnLikeType['id'] | undefined;
  export let conditionIdentifier: string | undefined;
  export let value: unknown | undefined;

  export let layout: 'horizontal' | 'vertical' = 'horizontal';
  export let disableColumnChange = false;
  export let allowDelete = true;
  export let numberOfFilters = 0;

  /**
   * Eslint recognizes an unnecessary type assertion that typecheck fails to
   * do in the svelte template below. *:/ Whaat? Needs more digging down*
   */
  // eslint-disable-next-line @typescript-eslint/no-unnecessary-type-assertion
  $: columnIdentifiers = columns.map(
    (_column) => _column.id,
  ) as ColumnLikeType['id'][];
  $: selectedColumn = columnIdentifier
    ? columns.find((column) => column.id === columnIdentifier)
    : undefined;
  $: selectedColumnFiltersMap =
    selectedColumn?.allowedFiltersMap ??
    (new Map() as ColumnLikeType['allowedFiltersMap']);
  $: conditionIds = [...selectedColumnFiltersMap].map(
    ([_conditionId]) => _conditionId,
  );
  $: selectedCondition = conditionIdentifier
    ? selectedColumnFiltersMap.get(conditionIdentifier)
    : undefined;
  $: selectedColumnInputCap = selectedColumn?.inputComponentAndProps;
  $: ({ recordsData } = $tabularData);
  $: ({ recordSummaries } = recordsData);

  const initialNoOfFilters = numberOfFilters;
  let showError = false;
  $: isValid = selectedCondition
    ? validateFilterEntry(selectedCondition, value)
    : false;
  $: if (numberOfFilters !== initialNoOfFilters) {
    showError = true;
  }

  let prevValue: unknown = value;
  let timer: number;

  onDestroy(() => {
    window.clearTimeout(timer);
  });

  function getColumnName(_columnId?: ColumnLikeType['id']) {
    const column = columns.find((columnEntry) => columnEntry.id === _columnId);
    if (column) {
      return getColumnLabel(column);
    }
    return '';
  }

  function getConditionName(_conditionId?: string) {
    if (_conditionId) {
      return selectedColumnFiltersMap.get(_conditionId)?.name ?? '';
    }
    return '';
  }

  function onValueUpdate(_value: unknown) {
    if (prevValue !== _value) {
      prevValue = _value;
      dispatch('update');
    }
  }

  function onValueChange(_value: unknown) {
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      onValueUpdate(_value);
    }, 500);
  }
  $: onValueChange(value);

  function onValueChangeFromUser() {
    clearTimeout(timer);
    onValueUpdate(value);
  }

  function calculateInputCap(
    _selectedCondition?: AbstractTypeFilterDefinition,
    _selectedColumn?: FilterEntryColumnLike,
  ): ComponentAndProps | undefined {
    const parameterTypeId = _selectedCondition?.parameters[0];
    // If there are no parameters, show no input. eg., isEmpty
    if (typeof parameterTypeId === 'undefined') {
      return undefined;
    }

    // If there is a parameter
    // Check if the type is same as column's type.
    // If yes, pass down column's calculated cap.
    // If no, pass down the type directly.
    const abstractTypeId = _selectedColumn?.abstractType.identifier;
    if (abstractTypeId === parameterTypeId && selectedColumnInputCap) {
      return selectedColumnInputCap;
    }
    return getDbTypeBasedInputCap({
      type: parameterTypeId,
      type_options: {},
      display_options: {},
    });
  }

  $: inputCap = calculateInputCap(selectedCondition, selectedColumn);

  function onColumnChange() {
    prevValue = undefined;
    value = undefined;
    dispatch('update');
  }

  function onConditionChange(_conditionId?: string) {
    if (!_conditionId) {
      return;
    }
    const condition = selectedColumnFiltersMap.get(_conditionId);
    if (!condition) {
      return;
    }
    if (typeof condition?.parameters[0] === 'undefined') {
      prevValue = undefined;
      value = undefined;
    }
    dispatch('update');
  }
</script>

<div class="filter-entry {layout}">
  {#if $$slots.default}
    <div class="prefix">
      <slot />
    </div>
  {/if}
  <InputGroup class={layout}>
    <Select
      options={columnIdentifiers}
      bind:value={columnIdentifier}
      getLabel={getColumnName}
      on:change={onColumnChange}
      triggerClass="filter-column-id"
      disabled={disableColumnChange}
    />
    {#key columnIdentifier}
      <Select
        options={conditionIds}
        bind:value={conditionIdentifier}
        getLabel={getConditionName}
        on:change={(e) => onConditionChange(e.detail)}
        triggerClass="filter-condition"
      />
    {/key}
    {#key `${columnIdentifier}${conditionIdentifier}`}
      {#if inputCap}
        <DynamicInput
          componentAndProps={inputCap}
          bind:value
          on:input={() => {
            showError = true;
          }}
          on:blur={() => {
            showError = true;
          }}
          on:change={onValueChangeFromUser}
          class="filter-input"
          hasError={showError && !isValid}
          getRecordSummary={(recordId) =>
            $recordSummaries.get(String(columnIdentifier))?.get(recordId)}
          setRecordSummary={(recordId, recordSummary) =>
            recordSummaries.addBespokeRecordSummary({
              columnId: String(columnIdentifier),
              recordId,
              recordSummary,
            })}
        />
      {/if}
    {/key}
    {#if allowDelete}
      <Button
        size="small"
        class="filter-remove"
        on:click={() => dispatch('removeFilter')}
      >
        <Icon {...iconDeleteMajor} />
      </Button>
    {/if}
  </InputGroup>
</div>

<style lang="scss">
  .filter-entry {
    display: flex;
    gap: 10px;

    .prefix {
      flex-basis: 80px;
      flex-shrink: 0;
      flex-grow: 0;
      display: flex;
      align-items: center;

      > :global(.input-group-text) {
        padding: 5px 13px;
      }
    }

    & + :global(.filter-entry) {
      margin-top: 6px;
    }

    &.horizontal {
      min-width: 560px;

      :global(.filter-column-id.trigger),
      :global(.filter-condition) {
        width: 140px;
        flex-basis: 140px;
        flex-shrink: 0;
        flex-grow: 0;
      }

      :global(.filter-input) {
        width: 160px;
        flex-basis: 160px;
        flex-grow: 0;
        flex-shrink: 0;
        max-height: 2.3rem;
        resize: none;
      }
    }

    &.vertical {
      :global(.filter-input) {
        flex-grow: 1;
        resize: vertical;
      }
    }

    :global(.filter-remove) {
      flex-shrink: 0;
      flex-grow: 0;
    }
  }
</style>
