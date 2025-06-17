<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import Default from '@mathesar/components/Default.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import Null from '@mathesar/components/Null.svelte';
  // TODO: Get Table here instead of tableId and remove need for the currentDatabase store
  import type { Database } from '@mathesar/models/Database';
  import { currentDatabase } from '@mathesar/stores/databases';
  import AttachableRowSeeker from '@mathesar/systems/row-seeker/AttachableRowSeeker.svelte';
  import AttachableRowSeekerController from '@mathesar/systems/row-seeker/AttachableRowSeekerController';
  // eslint-disable-next-line import/no-cycle
  import {
    Icon,
    compareWholeValues,
    iconExpandDown,
  } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';
  import type { LinkedRecordCellProps } from '../typeDefinitions';

  type $$Props = LinkedRecordCellProps;

  const dispatch = createEventDispatcher();

  export let isActive: $$Props['isActive'];
  export let columnFabric: $$Props['columnFabric'];
  export let value: $$Props['value'] = undefined;
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

  function getController(
    _wrapper: HTMLElement,
    _tableId: number,
    _db: Database,
  ) {
    return new AttachableRowSeekerController(_wrapper, {
      onClose: () => {
        _wrapper?.focus();
      },
      rowSeekerProps: {
        targetTable: {
          databaseId: _db.id,
          tableOid: _tableId,
        },
      },
    });
  }

  $: attachableRowSeekerController = getController(
    cellWrapperElement,
    tableId,
    $currentDatabase,
  );

  async function launchRecordSelector(event?: MouseEvent) {
    if (disabled) {
      return;
    }
    const linkedFkColumnId = columnFabric.linkFk?.referent_columns[0];
    if (!linkedFkColumnId) {
      throw Error('Linked fk column not present. This should never occur');
    }

    const result = await attachableRowSeekerController.acquireUserSelection();

    value = result.record[linkedFkColumnId];

    setRecordSummary(String(value), result.recordSummary);
    dispatch('update', { value });
  }

  function closeRecordSelector() {
    attachableRowSeekerController.close();
  }

  async function toggleRecordSelector(event?: MouseEvent) {
    if (get(attachableRowSeekerController.isOpen)) {
      closeRecordSelector();
    } else {
      await launchRecordSelector(event);
    }
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isActive) {
          void toggleRecordSelector();
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
        closeRecordSelector();
        break;
      case 'Escape':
        closeRecordSelector();
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
      void toggleRecordSelector();
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
        aria-label={$_('pick_record')}
        title={$_('pick_record')}
      >
        <Icon {...iconExpandDown} />
      </button>
    {/if}
  </div>
</CellWrapper>

<AttachableRowSeeker
  selectedRecord={value
    ? {
        summary: recordSummary ?? '',
        pk: value,
      }
    : undefined}
  controller={attachableRowSeekerController}
/>

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
    color: var(--text-color);
  }
  .disabled .value {
    padding-right: var(--cell-padding);
  }
  .dropdown-button {
    padding: 0 var(--cell-padding);
    display: flex;
    align-items: center;
    color: var(--text-color-muted);
  }
  .dropdown-button:hover {
    color: var(--text-color);
  }
</style>
