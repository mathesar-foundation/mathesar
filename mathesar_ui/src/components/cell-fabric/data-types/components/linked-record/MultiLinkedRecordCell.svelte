<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { writable } from 'svelte/store';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type {
    RecordsSummaryListResponse,
    SummarizedRecordReference,
  } from '@mathesar/api/rpc/_common/commonTypes';
  import type { SqlExpr } from '@mathesar/api/rpc/records';
  import Default from '@mathesar/components/Default.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import AsyncStore from '@mathesar/stores/AsyncStore';
  import type { RecordsData } from '@mathesar/stores/table-data';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import {
    type AttachableRowSeekerController,
    rowSeekerContext,
  } from '@mathesar/systems/row-seeker/AttachableRowSeekerController';
  import type { RowSeekerRecordStore } from '@mathesar/systems/row-seeker/RowSeekerController';
  import {
    Icon,
    compareWholeValues,
    iconExpandDown,
  } from '@mathesar-component-library';

  import CellWrapper from '../CellWrapper.svelte';
  import type { MultiLinkedRecordCellProps } from '../typeDefinitions';

  import {
    addIntermediateTableRecords as addIntermediateTableRecordsUtil,
    removeIntermediateTableRecords as removeIntermediateTableRecordsUtil,
  } from './linkedRecordDmlUtils';

  type $$Props = MultiLinkedRecordCellProps;

  const dispatch = createEventDispatcher();
  const rowSeeker = rowSeekerContext.get();

  // Get recordsData from context for refreshing after DML operations
  let tabularData:
    | ReturnType<typeof getTabularDataStoreFromContext>
    | undefined;
  try {
    tabularData = getTabularDataStoreFromContext();
  } catch {
    // Context not available (e.g., in standalone usage)
    tabularData = undefined;
  }
  $: recordsData =
    tabularData && $tabularData ? $tabularData.recordsData : undefined;

  export let isActive: $$Props['isActive'];
  // svelte-ignore unused-export-let
  export const columnFabric: $$Props['columnFabric'] =
    undefined as unknown as $$Props['columnFabric'];
  export let value: $$Props['value'] = undefined;
  export let searchValue: $$Props['searchValue'] = undefined;
  export let recordSummaries: $$Props['recordSummaries'] = undefined;

  // Create a writable store for record summaries so we can update it when adding new records
  const recordSummariesStore = writable<Map<string, string>>(
    new Map<string, string>(),
  );

  $: {
    // Prefer cache over prop if available
    const cacheSummaries =
      tabularData && $tabularData
        ? $tabularData.recordSummariesCache.getSummaries(tableId)
        : undefined;
    const summariesToUse = cacheSummaries
      ? new Map(cacheSummaries.getEntries())
      : recordSummaries ?? new Map<string, string>();
    recordSummariesStore.set(new Map(summariesToUse));
  }

  $: recordSummariesMap = $recordSummariesStore;

  // Helper function to update both the store and the external setRecordSummary
  function updateRecordSummary(recordId: string, summary: string) {
    // Update the local store immediately for UI responsiveness
    recordSummariesStore.update((map) => {
      const newMap = new Map(map);
      newMap.set(recordId, summary);
      return newMap;
    });
    // Update the centralized cache if available
    if (tabularData && $tabularData) {
      $tabularData.recordSummariesCache.updateSummary(
        tableId,
        recordId,
        summary,
      );
    }
    // Also call the external setter for persistence
    setRecordSummary(recordId, summary);
  }
  export let setRecordSummary: Required<$$Props>['setRecordSummary'] = () => {};
  export let disabled: $$Props['disabled'];
  export let tableId: $$Props['tableId'];
  export let databaseId: $$Props['databaseId'];
  export let isIndependentOfSheet: $$Props['isIndependentOfSheet'];
  export let intermediateTableOid: $$Props['intermediateTableOid'] = undefined;
  export let fkToBaseAttnum: $$Props['fkToBaseAttnum'] = undefined;
  export let fkToTargetAttnum: $$Props['fkToTargetAttnum'] = undefined;
  export let baseTableRowPk: $$Props['baseTableRowPk'] = undefined;
  export let cellKey: $$Props['cellKey'] = undefined;
  export let modificationStatusMap: $$Props['modificationStatusMap'] =
    undefined;

  let wasActiveBeforeClick = false;
  let cellWrapperElement: HTMLElement;

  $: recordIds = Array.isArray(value) ? value : [];
  $: hasValue = recordIds.length > 0;
  $: valueComparisonOutcome = compareWholeValues(searchValue, value);

  // Wrapper functions to call utilities with cell-specific props
  async function addIntermediateTableRecords(
    targetRecordIds: (string | number)[],
  ): Promise<void> {
    return addIntermediateTableRecordsUtil(
      databaseId,
      intermediateTableOid,
      fkToBaseAttnum,
      fkToTargetAttnum,
      baseTableRowPk,
      targetRecordIds,
    );
  }

  async function removeIntermediateTableRecords(
    targetRecordId: string | number,
  ): Promise<void> {
    return removeIntermediateTableRecordsUtil(
      databaseId,
      intermediateTableOid,
      fkToBaseAttnum,
      fkToTargetAttnum,
      baseTableRowPk,
      targetRecordId,
    );
  }

  // Get record store from centralized cache
  function getRecordStore(): RowSeekerRecordStore {
    if (tabularData && $tabularData) {
      return $tabularData.getRecordSummariesStore(tableId, databaseId);
    }
    // Fallback: create a temporary store if context is not available
    // This should rarely happen, but provides backward compatibility
    return new AsyncStore<
      {
        limit?: number | null;
        offset?: number | null;
        search?: string | null;
      },
      RecordsSummaryListResponse
    >(async (params) => {
      const { limit = null, offset = null, search = null } = params;
      const response = await api.records
        .list_summaries({
          database_id: databaseId,
          table_oid: tableId,
          limit: limit ?? undefined,
          offset: offset ?? undefined,
          search: search ?? undefined,
        })
        .run();
      return response;
    });
  }

  async function launchRowSeeker(event?: MouseEvent) {
    if (!rowSeeker) return;
    if (disabled) return;
    event?.stopPropagation();

    try {
      // Convert current record IDs to SummarizedRecordReference format for previousValue
      const previousValues: SummarizedRecordReference[] = recordIds
        .map((id) => {
          const idString = String(id);
          const summary = recordSummariesMap.get(idString);
          return {
            key: id,
            summary: summary ?? idString,
          } as SummarizedRecordReference;
        })
        .filter(
          (ref) =>
            ref.key !== null &&
            ref.key !== undefined &&
            typeof ref.key !== 'boolean',
        );

      // Use onSelect callback to save immediately on each checkbox click
      await rowSeeker.acquireUserSelection({
        selectionType: 'multiple',
        constructRecordStore: getRecordStore,
        previousValue: previousValues,
        triggerElement: cellWrapperElement,
        onSelect: async (selectedRecords) => {
          if (selectedRecords) {
            const records = Array.isArray(selectedRecords)
              ? selectedRecords
              : [selectedRecords];

            // Extract IDs and update summaries
            const newRecordIds: (string | number)[] = [];
            records.forEach((record) => {
              if (
                record &&
                record.key !== null &&
                record.key !== undefined &&
                typeof record.key !== 'boolean'
              ) {
                const idString = String(record.key);
                newRecordIds.push(record.key);
                if (record.summary) {
                  updateRecordSummary(idString, record.summary);
                }
              }
            });

            // Calculate which records were added
            const currentIds = new Set(recordIds.map((id) => String(id)));
            const addedIds = newRecordIds.filter(
              (id) => !currentIds.has(String(id)),
            );

            // Perform DML operations if we have intermediate table info
            if (
              intermediateTableOid &&
              fkToBaseAttnum !== undefined &&
              fkToTargetAttnum !== undefined &&
              baseTableRowPk !== undefined &&
              addedIds.length > 0
            ) {
              // Update modification status to processing
              if (cellKey && modificationStatusMap) {
                modificationStatusMap.set(cellKey, { state: 'processing' });
              }
              try {
                await addIntermediateTableRecords(addedIds);
                // Update modification status to success immediately after save completes
                if (cellKey && modificationStatusMap) {
                  modificationStatusMap.set(cellKey, { state: 'success' });
                }
                // Refresh data after successful add (don't clear statuses so success state is preserved)
                if (recordsData) {
                  await recordsData.fetch({
                    setLoadingState: false,
                    clearMetaStatuses: false,
                  });
                }
              } catch (error) {
                console.error(
                  'Error adding records to intermediate table:',
                  error,
                );
                // Update modification status to failure
                if (cellKey && modificationStatusMap) {
                  modificationStatusMap.set(cellKey, {
                    state: 'failure',
                    errors: [RpcError.fromAnything(error)],
                  });
                }
                // Still update the UI value even if DML fails
                // (the user can see the error and retry)
              }
            }

            value = newRecordIds.length > 0 ? newRecordIds : null;
            dispatch('update', { value });
          } else {
            // All records removed
            if (
              intermediateTableOid &&
              fkToBaseAttnum !== undefined &&
              fkToTargetAttnum !== undefined &&
              baseTableRowPk !== undefined &&
              recordIds.length > 0
            ) {
              // Update modification status to processing
              if (cellKey && modificationStatusMap) {
                modificationStatusMap.set(cellKey, { state: 'processing' });
              }
              try {
                // Remove all current records
                for (const recordId of recordIds) {
                  await removeIntermediateTableRecords(recordId);
                }
                // Update modification status to success immediately after save completes
                if (cellKey && modificationStatusMap) {
                  modificationStatusMap.set(cellKey, { state: 'success' });
                }
                // Refresh data after successful removal (don't clear statuses so success state is preserved)
                if (recordsData) {
                  await recordsData.fetch({
                    setLoadingState: false,
                    clearMetaStatuses: false,
                  });
                }
              } catch (error) {
                console.error(
                  'Error removing records from intermediate table:',
                  error,
                );
                // Update modification status to failure
                if (cellKey && modificationStatusMap) {
                  modificationStatusMap.set(cellKey, {
                    state: 'failure',
                    errors: [RpcError.fromAnything(error)],
                  });
                }
              }
            }
            value = null;
            dispatch('update', { value });
          }
        },
      });
    } catch {
      // do nothing - row seeker was closed
    }
    // Re-focus the cell element so that the user can use the keyboard to move
    // the active cell.
    cellWrapperElement?.focus();
  }

  async function removeRecord(recordId: unknown) {
    if (disabled) {
      return;
    }

    // Perform DML operation if we have intermediate table info
    if (
      intermediateTableOid &&
      fkToBaseAttnum !== undefined &&
      fkToTargetAttnum !== undefined &&
      baseTableRowPk !== undefined
    ) {
      // Update modification status to processing
      if (cellKey && modificationStatusMap) {
        modificationStatusMap.set(cellKey, { state: 'processing' });
      }
      try {
        await removeIntermediateTableRecords(recordId as string | number);
        // Update modification status to success immediately after save completes
        if (cellKey && modificationStatusMap) {
          modificationStatusMap.set(cellKey, { state: 'success' });
        }
        // Refresh data after successful removal (don't clear statuses so success state is preserved)
        if (recordsData) {
          await recordsData.fetch({
            setLoadingState: false,
            clearMetaStatuses: false,
          });
        }
      } catch (error) {
        console.error('Error removing record from intermediate table:', error);
        // Update modification status to failure
        if (cellKey && modificationStatusMap) {
          modificationStatusMap.set(cellKey, {
            state: 'failure',
            errors: [RpcError.fromAnything(error)],
          });
        }
        // Still update the UI value even if DML fails
        // (the user can see the error and retry)
      }
    }

    const newRecordIds = recordIds.filter((id) => id !== recordId);
    value = newRecordIds.length > 0 ? newRecordIds : null;
    dispatch('update', { value });
  }

  function handleWrapperKeyDown(e: KeyboardEvent) {
    switch (e.key) {
      case 'Enter':
        if (isActive) {
          void launchRowSeeker();
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
      void launchRowSeeker();
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
  on:dblclick={launchRowSeeker}
  hasPadding={false}
  bind:element={cellWrapperElement}
>
  <div class="multi-linked-record-cell" class:disabled>
    <div class="value">
      {#if hasValue}
        <div class="pills-container">
          {#each recordIds as recordId}
            {@const recordIdString = String(recordId)}
            {@const recordSummary = recordSummariesMap.get(recordIdString)}
            <LinkedRecord
              {tableId}
              {recordId}
              {recordSummary}
              hasDeleteButton={!disabled}
              on:delete={() => removeRecord(recordId)}
              {valueComparisonOutcome}
              allowsHyperlinks={true}
            />
          {/each}
        </div>
      {:else if value === undefined}
        <Default />
      {:else if value === null || (Array.isArray(value) && value.length === 0)}
        <Null />
      {:else}
        <!-- Debug: show what we got -->
        <div style="color: red; font-size: 10px;">
          Debug: value={JSON.stringify(value)}, type={typeof value}, isArray={Array.isArray(
            value,
          )}
        </div>
      {/if}
    </div>
    {#if !disabled}
      <button
        class="dropdown-button passthrough"
        on:click={launchRowSeeker}
        aria-label={$_('pick_record')}
        title={$_('pick_record')}
      >
        <Icon {...iconExpandDown} />
      </button>
    {/if}
  </div>
</CellWrapper>

<style>
  .multi-linked-record-cell {
    flex: 1 0 auto;
    display: flex;
    justify-content: space-between;
    align-items: center;
  }
  .value {
    padding: var(--cell-padding);
    align-self: center;
    overflow: hidden;
    flex: 1 1 auto;
    min-width: 0; /* Allow flex shrinking */
    color: var(--color-fg-base);
  }
  .disabled .value {
    padding-right: var(--cell-padding);
  }
  .pills-container {
    display: flex;
    flex-wrap: nowrap;
    flex-direction: row;
    gap: 0.25rem;
    align-items: center;
    width: 100%;
    overflow-x: auto;
    overflow-y: hidden;
  }

  .pills-container :global(.linked-record) {
    flex-shrink: 0;
    min-width: fit-content;
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
