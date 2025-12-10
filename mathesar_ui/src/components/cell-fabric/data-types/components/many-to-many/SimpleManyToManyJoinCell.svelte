<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import Null from '@mathesar/components/Null.svelte';
  import { parseCellId } from '@mathesar/components/sheet/cellIds';
  import { databasesStore } from '@mathesar/stores/databases';
  // eslint-disable-next-line import/no-cycle
  import {
    getTabularDataStoreFromContext,
    isPersistedRecordRow,
  } from '@mathesar/stores/table-data';
  import { multiTaggerContext } from '@mathesar/systems/multi-tagger/AttachableMultiTaggerController';
  import { Badge, Icon, iconExpandDown } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';
  import type { SimpleManyToManyJoinCellProps } from '../typeDefinitions';

  type $$Props = SimpleManyToManyJoinCellProps;

  const dispatch = createEventDispatcher();
  const multiTaggerController = multiTaggerContext.getOrError();

  const tabularData = getTabularDataStoreFromContext();

  export let isActive: $$Props['isActive'];
  export let value: $$Props['value'] = undefined;
  export let disabled: $$Props['disabled'];
  export let columnAlias: $$Props['columnAlias'];
  export let joinPath: $$Props['joinPath'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let joinedRecordSummariesMap: $$Props['joinedRecordSummariesMap'] =
    undefined;

  let wasActiveBeforeClick = false;
  let cellWrapperElement: HTMLElement;

  $: items = value?.result ?? [];
  $: totalCount = value?.count ?? 0;
  $: remainingCount = totalCount - items.length;
  $: itemsWithSummaries = items
    .filter((i) => i !== null)
    .map((itemId) => {
      const summary = joinedRecordSummariesMap?.get(String(itemId));
      return {
        id: itemId,
        summary: summary ?? String(itemId),
      };
    });

  function openMultiTagger(event?: MouseEvent) {
    const database = get(databasesStore.currentDatabase);
    if (!database) return;
    const { table, columnsDataStore, selection, recordsData } =
      get(tabularData);
    const pkColumn = get(columnsDataStore.pkColumn);
    if (!pkColumn) return;
    const { activeCellId } = get(selection);
    if (!activeCellId) return;
    const { rowId } = parseCellId(activeCellId);
    const rows = get(recordsData.selectableRowsMap);
    const row = rows.get(rowId);
    if (!row) return;
    const currentTablePkColumnAttnum = pkColumn.id;
    const currentRecordPk = row.record[currentTablePkColumnAttnum];
    if (currentRecordPk === undefined) return;

    event?.stopPropagation();

    multiTaggerController.open({
      triggerElement: cellWrapperElement,
      database: { id: database.id },
      currentTable: {
        oid: table.oid,
        pkColumnAttnum: currentTablePkColumnAttnum,
      },
      currentRecordPk,
      intermediateTable: {
        oid: joinPath[0][1][0],
        attnumOfFkToCurrentTable: joinPath[0][1][1],
        attnumOfFkToTargetTable: joinPath[1][0][1],
      },
      targetTable: {
        oid: joinPath[1][1][0],
        pkColumnAttnum: joinPath[1][1][1],
      },
      onMappingChange: async () => {
        if (isPersistedRecordRow(row)) {
          const result = await recordsData.refetchAndMutateRow(row);
          dispatch('update', {
            value: result.record[columnAlias],
            preventFocus: true,
          });
        }
      },
    });
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isActive) {
          openMultiTagger();
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
      openMultiTagger();
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
  on:dblclick={openMultiTagger}
  hasPadding={false}
  bind:element={cellWrapperElement}
>
  <div
    class="simple-many-to-many-join-cell"
    class:disabled
    class:independent={isIndependentOfSheet}
  >
    <div class="value">
      {#if value && value.result.length > 0}
        <div class="pills-container">
          {#each itemsWithSummaries as { id, summary } (id)}
            <span class="pill">
              {summary}
            </span>
          {/each}
          {#if remainingCount > 0}
            <span class="remaining-count">+{remainingCount}</span>
          {/if}
        </div>
      {:else if value === null}
        <Null />
      {/if}
    </div>
    {#if isIndependentOfSheet}
      <div class="total-count">
        {$_('count_records', { values: { count: totalCount } })}
      </div>
    {:else if totalCount > 0}
      <div class="count-number">
        <Badge>
          {totalCount}
        </Badge>
      </div>
    {/if}
    {#if !disabled && !isIndependentOfSheet}
      <button
        class="dropdown-button passthrough"
        on:click={openMultiTagger}
        aria-label={$_('pick_record')}
        title={$_('pick_record')}
      >
        <Icon {...iconExpandDown} />
      </button>
    {/if}
  </div>
</CellWrapper>

<style lang="scss">
  .simple-many-to-many-join-cell {
    flex: 1 0 auto;
    display: flex;
    align-items: center;
    justify-content: space-between;

    .value {
      padding: var(--cell-padding);
      overflow: hidden;
      flex: 1;
      min-width: 0;
    }

    .pills-container {
      display: flex;
      flex-wrap: nowrap;
      gap: 0.25rem;
      align-items: center;
      overflow: hidden;
    }

    .pill {
      padding: 0.1rem 0.4rem;
      background: var(--color-record-fk-20);
      border: 1px solid var(--color-record-fk-25);
      border-radius: 0.25rem;
      white-space: nowrap;
      flex-shrink: 0;
    }

    .remaining-count {
      color: var(--color-fg-base-muted);
      font-size: var(--sm1);
      white-space: nowrap;
      align-self: center;
    }

    .count-number {
      font-size: var(--sm1);
      white-space: nowrap;
      --badge-font-size: var(--sm1);
      --badge-text-color: var(--color-fg-subtle-1);
      --badge-background-color: var(--cell-bg-color-joined-header);
    }

    .dropdown-button {
      cursor: pointer;
      padding: 0 var(--cell-padding);
      display: flex;
      align-items: center;
      color: var(--color-fg-base-disabled);

      &:hover {
        color: var(--color-fg-base);
      }
    }

    &.independent {
      flex-direction: column;
      align-items: flex-start;
      gap: var(--sm2);

      .value {
        padding: 0;
        width: 100%;
        overflow: visible;
        order: 0;
      }

      .pills-container {
        flex-wrap: wrap;
        overflow: visible;
      }

      .pill {
        white-space: normal;
        word-wrap: break-word;
        word-break: break-word;
        overflow-wrap: break-word;
        flex-shrink: unset;
      }

      .total-count {
        align-self: flex-start;
        order: -1;
        margin-top: 0;
      }
    }

    &.disabled .value {
      padding-right: var(--cell-padding);
    }
  }
</style>
