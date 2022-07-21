<script lang="ts">
  import { createEventDispatcher, onDestroy } from 'svelte';
  import { faTrashAlt } from '@fortawesome/free-solid-svg-icons';
  import {
    InputGroup,
    Icon,
    Button,
    Select,
  } from '@mathesar-component-library';
  import type { ComponentAndProps } from '@mathesar-component-library/types';
  import type { FilterEntry } from '@mathesar/stores/table-data/types';
  import type { AbstractTypeFilterDefinition } from '@mathesar/stores/abstract-types/types';
  import DataTypeBasedInput from '@mathesar/components/cell/DataTypeBasedInput.svelte';
  import type { CellColumnLike } from '@mathesar/components/cell/data-types/typeDefinitions';
  import type {
    ProcessedTableColumn,
    ProcessedTableColumnMap,
  } from '../../utils';
  import { validateFilterEntry } from './utils';

  const dispatch = createEventDispatcher();

  export let processedTableColumnsMap: ProcessedTableColumnMap;

  export let columnId: FilterEntry['columnId'] | undefined;
  export let conditionId: FilterEntry['conditionId'] | undefined;
  export let value: FilterEntry['value'] | undefined;
  export let noOfFilters: number;

  $: columnIds = [...processedTableColumnsMap].map(([_columnId]) => _columnId);
  $: processedSelectedColumn = columnId
    ? processedTableColumnsMap.get(columnId)
    : undefined;
  $: selectedColumnFiltersMap =
    processedSelectedColumn?.allowedFiltersMap ??
    (new Map() as ProcessedTableColumn['allowedFiltersMap']);
  $: conditionIds = [...selectedColumnFiltersMap].map(
    ([_conditionId]) => _conditionId,
  );
  $: selectedCondition = conditionId
    ? selectedColumnFiltersMap.get(conditionId)
    : undefined;
  $: selectedColumnInputCap = processedSelectedColumn?.dbTypeInputCap;

  const initialNoOfFilters = noOfFilters;
  let showError = false;
  $: isValid = selectedCondition
    ? validateFilterEntry(selectedCondition, value)
    : false;
  $: if (noOfFilters !== initialNoOfFilters) {
    showError = true;
  }

  let prevValue: unknown = value;
  let timer: number;

  onDestroy(() => {
    window.clearTimeout(timer);
  });

  function getColumnName(_columnId?: FilterEntry['columnId']) {
    if (_columnId) {
      return processedTableColumnsMap.get(_columnId)?.column.name ?? '';
    }
    return '';
  }

  function getConditionName(_conditionId?: FilterEntry['conditionId']) {
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
    _processedSelectedColumn?: ProcessedTableColumn,
  ):
    | { column: CellColumnLike }
    | { componentAndProps: ComponentAndProps<unknown> }
    | undefined {
    const parameterTypeId = _selectedCondition?.parameters[0];
    // If there are no parameters, show no input. eg., isEmpty
    if (typeof parameterTypeId === 'undefined') {
      return undefined;
    }

    // If there is a parameter
    // Check if the type is same as column's type.
    // If yes, pass down column's calculated cap.
    // If no, pass down the type directly.
    const abstractTypeId =
      _processedSelectedColumn?.abstractTypeOfColumn.identifier;
    if (abstractTypeId === parameterTypeId && selectedColumnInputCap) {
      return { componentAndProps: selectedColumnInputCap };
    }
    return {
      column: {
        type: parameterTypeId,
        type_options: {},
        display_options: {},
      },
    };
  }

  $: inputCap = calculateInputCap(selectedCondition, processedSelectedColumn);

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

<div class="filter-entry">
  <div class="prefix">
    <slot />
  </div>
  <InputGroup>
    <Select
      options={columnIds}
      bind:value={columnId}
      getLabel={getColumnName}
      on:change={onColumnChange}
      triggerClass="filter-column-id"
    />
    <Select
      options={conditionIds}
      bind:value={conditionId}
      getLabel={getConditionName}
      on:change={(e) => onConditionChange(e.detail)}
      triggerClass="filter-condition"
    />
    {#if inputCap}
      <DataTypeBasedInput
        bind:value
        {...inputCap}
        on:input={() => {
          showError = true;
        }}
        on:blur={() => {
          showError = true;
        }}
        on:change={onValueChangeFromUser}
        class="filter-input"
        hasError={showError && !isValid}
      />
    {/if}
    <Button
      size="small"
      class="filter-remove"
      on:click={() => dispatch('removeFilter')}
    >
      <Icon data={faTrashAlt} />
    </Button>
  </InputGroup>
</div>

<style lang="scss">
  .filter-entry {
    display: flex;
    min-width: 560px;
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

    :global(.filter-column-id.trigger) {
      width: 140px;
      flex-basis: 140px;
      flex-shrink: 0;
      flex-grow: 0;
    }
    :global(.filter-condition) {
      width: 140px;
      flex-basis: 140px;
      flex-shrink: 0;
      flex-grow: 0;
    }

    :global(.filter-input) {
      width: 160px;
      flex-basis: 160px;
      flex-shrink: 0;
      flex-grow: 0;
      max-height: 31.5px;
      resize: none;
    }

    :global(.filter-remove) {
      flex-shrink: 0;
      flex-grow: 0;
    }
  }
</style>
