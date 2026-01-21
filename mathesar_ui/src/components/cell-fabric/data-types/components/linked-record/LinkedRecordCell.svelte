<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import Default from '@mathesar/components/Default.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { recordSelectorContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import {
    Icon,
    compareWholeValues,
    iconExpandDown,
  } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';
  import type {
    ForeignKeyCellValue,
    LinkedRecordCellProps,
  } from '../typeDefinitions';

  type $$Props = LinkedRecordCellProps;

  const dispatch = createEventDispatcher();
  const recordSelector = recordSelectorContext.get();

  export let isActive: $$Props['isActive'];
  export let columnFabric: $$Props['columnFabric'];
  export let value: $$Props['value'] = undefined;
  export let setValue: (newValue: $$Props['value']) => void;
  export let searchValue: $$Props['searchValue'] = undefined;
  export let recordSummary: $$Props['recordSummary'] = undefined;
  export let setRecordSummary: Required<$$Props>['setRecordSummary'] = () => {};
  export let disabled: $$Props['disabled'];
  export let tableId: $$Props['tableId'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];

  let wasActiveBeforeClick = false;
  let cellWrapperElement: HTMLElement;

  $: hasValue = value !== undefined && value !== null;
  $: valueComparisonOutcome = compareWholeValues(searchValue, value);

  async function launchRecordSelector(event?: MouseEvent) {
    if (!recordSelector) return;
    if (disabled) return;
    event?.stopPropagation();
    try {
      const result = await recordSelector.acquireUserInput({
        tableOid: tableId,
      });
      let newValue: ForeignKeyCellValue;
      if (result) {
        const linkedFkColumnId = columnFabric.linkFk?.referent_columns[0];
        if (linkedFkColumnId) {
          const fkValue = result.record[linkedFkColumnId];
          // ResultValue accepts arrays, however we do not support fk values that are arrays.
          // If an fk value is an array (currently not possible in Mathesar), we take the first element.
          newValue = Array.isArray(fkValue) ? fkValue[0] : fkValue;
        } else {
          newValue = result.recordId as ForeignKeyCellValue;
        }
        setValue(newValue);
        setRecordSummary(String(result.recordId), result.recordSummary);
      } else {
        newValue = null;
        setValue(newValue);
      }
    } catch {
      // do nothing - record selector was closed
    }
    // Re-focus the cell element so that the user can yes the keyboard to move
    // the active cell.
    cellWrapperElement?.focus();
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isActive) {
          void launchRecordSelector();
        }
        break;
      case 'Tab':
      case 'ArrowLeft':
      case 'ArrowRight':
      case 'ArrowDown':
      case 'ArrowUp':
        dispatch('movementKeyDown', {
          originalEvent: e,
          key: e.key,
        });
        break;
      default:
        break;
    }
  }

  function handleMouseDown() {
    wasActiveBeforeClick = isActive;
    dispatch('activate');
  }

  function handleClick() {
    if (wasActiveBeforeClick) {
      void launchRecordSelector();
    }
  }
</script>

<CellWrapper
  {isActive}
  {disabled}
  {isIndependentOfSheet}
  on:mouseenter
  on:keydown={handleWrapperKeyDown}
  on:mousedown={handleMouseDown}
  on:click={handleClick}
  on:dblclick={launchRecordSelector}
  hasPadding={false}
  bind:element={cellWrapperElement}
>
  <div class="linked-record-cell" class:disabled>
    <div class="value">
      {#if hasValue}
        <LinkedRecord
          recordId={value}
          {recordSummary}
          {valueComparisonOutcome}
        />
      {:else if value === undefined}
        <Default />
      {:else}
        <Null />
      {/if}
    </div>
    {#if !disabled}
      <button
        class="dropdown-button passthrough"
        on:click={(event) => {
          if (event.shiftKey) {
            // Do not open the record selector on Shift+click
            event.stopPropagation();
            return;
          }
          void launchRecordSelector(event);
        }}
        aria-label={$_('pick_record')}
        title={$_('pick_record')}
      >
        <Icon {...iconExpandDown} />
      </button>
    {/if}
  </div>
</CellWrapper>

<style>
  .linked-record-cell {
    flex: 1 0 auto;
    display: flex;
    justify-content: space-between;
  }
  .value {
    padding: var(--cell-padding);
    align-self: center;
    overflow: hidden;
    width: max-content;
    max-width: 100%;
    color: var(--color-fg-base);
  }
  .disabled .value {
    padding-right: var(--cell-padding);
  }
  .dropdown-button {
    cursor: pointer;
    padding: 0 var(--cell-padding);
    display: flex;
    align-items: center;
    color: var(--color-fg-base-disabled);
  }
  .dropdown-button:hover {
    color: var(--color-fg-base);
  }
</style>
