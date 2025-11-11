<script lang="ts">
  import { onDestroy } from 'svelte';
  import type { Writable } from 'svelte/store';
  import { type Readable, derived, get } from 'svelte/store';

  import {
    type RequestStatus,
    States,
  } from '@mathesar/api/rest/utils/requestUtils';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import { parseFileReference } from '@mathesar/components/file-attachments/fileUtils';
  import RowCellBackgrounds from '@mathesar/components/RowCellBackgrounds.svelte';
  import { SheetDataCell } from '@mathesar/components/sheet';
  import { makeCellId } from '@mathesar/components/sheet/cellIds';
  import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
  import { handleKeyboardEventOnCell } from '@mathesar/components/sheet/sheetKeyboardUtils';
  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import {
    type CellKey,
    type ClientSideCellError,
    type ProcessedColumn,
    type RecordRow,
    type RecordsData,
    RelatedColumn,
    getRowSelectionId,
    getTabularDataStoreFromContext,
    isPlaceholderRecordRow,
    isProvisionalRecordRow,
  } from '@mathesar/stores/table-data';
  import type { WritableMap } from '@mathesar-component-library';

  import CellErrors from './CellErrors.svelte';

  export let recordsData: RecordsData;
  export let selection: Writable<SheetSelection>;
  export let row: RecordRow;
  export let rowHasErrors = false;
  export let key: CellKey;
  export let modificationStatusMap: WritableMap<
    CellKey,
    RequestStatus<RpcError[]>
  >;
  export let processedColumn: ProcessedColumn | RelatedColumn;
  export let clientSideErrorMap: WritableMap<CellKey, ClientSideCellError[]>;
  export let value: unknown = undefined;
  export let canUpdateRecords: boolean;

  const tabularData = getTabularDataStoreFromContext();

  $: effectiveProcessedColumn =
    isProvisionalRecordRow(row) && !(processedColumn instanceof RelatedColumn)
      ? processedColumn.withoutEnhancedPkCell()
      : processedColumn;
  $: cellId = makeCellId(
    getRowSelectionId(row),
    String(effectiveProcessedColumn.id),
  );

  // To be used in case of publicly shared links where user should not be able
  // to view linked tables & explorations
  const canViewLinkedEntities = true;

  $: recordsDataState = recordsData.state;
  $: ({
    linkedRecordSummaries,
    fileManifests,
    relatedColumnValues,
    relatedColumnSummaries,
  } = recordsData);
  $: ({ column } = effectiveProcessedColumn);
  $: columnId = column.id;
  $: isWithinPlaceholderRow = isPlaceholderRecordRow(row);
  $: modificationStatus = $modificationStatusMap.get(key);
  $: serverErrors =
    modificationStatus?.state === 'failure' ? modificationStatus?.errors : [];
  $: clientErrors = $clientSideErrorMap.get(key) ?? [];
  $: errors = [...serverErrors, ...clientErrors];
  $: hasServerError = !!serverErrors.length;
  $: hasClientError = !!clientErrors.length;
  $: hasError = hasClientError || hasServerError;
  $: isProcessing = modificationStatus?.state === 'processing';
  // TODO: Handle case where INSERT is allowed, but UPDATE isn't
  // i.e. row is a placeholder row and record isn't saved yet
  $: isEditable = canUpdateRecords && effectiveProcessedColumn.isEditable;

  // Get value - for related columns, fetch from relatedColumnValues store
  // Use derived stores to properly subscribe to nested WritableMap structure
  $: relatedColumnId =
    processedColumn instanceof RelatedColumn && !isPlaceholderRecordRow(row)
      ? String(processedColumn.id)
      : null;
  $: rowPkForRelatedColumn =
    processedColumn instanceof RelatedColumn && !isPlaceholderRecordRow(row)
      ? $tabularData.getRecordIdFromRowId(getRowSelectionId(row))
      : undefined;

  // Memoize nested store subscriptions to prevent recreation on every render
  // Cache key: `${relatedColumnId}_${rowPkForRelatedColumn}`
  const nestedStoreCache = new Map<string, Readable<unknown | undefined>>();
  let currentCacheKey: string | null = null;
  // Track whether we've verified the nested map exists for the current cache key
  // This avoids expensive checks on every reactive evaluation
  let lastVerifiedCacheKey: string | null = null;

  // Helper function to flatten nested Readable<Readable<T>> structure
  function flattenNestedReadable<T>(
    outerReadable: Readable<Readable<T> | undefined | null>,
  ): Readable<T | undefined> {
    return derived(outerReadable, (innerReadable, set) => {
      if (!innerReadable) {
        set(undefined);
        return;
      }
      // Subscribe to the inner readable
      const unsubscribe = innerReadable.subscribe(set);
      return unsubscribe;
    });
  }

  // Get or create the nested store subscription, memoized by (relatedColumnId, rowPk)
  $: relatedColumnValueStore = (() => {
    if (!relatedColumnId || rowPkForRelatedColumn === undefined) {
      currentCacheKey = null;
      lastVerifiedCacheKey = null;
      return null;
    }

    const cacheKey = `${relatedColumnId}_${String(rowPkForRelatedColumn)}`;

    // Only check for map changes when the cache key changes (i.e., when we need a new store)
    // This avoids expensive synchronous checks on every reactive evaluation
    if (cacheKey !== currentCacheKey) {
      currentCacheKey = cacheKey;

      // Check if the nested map exists and has a value for this row
      // Only do this check when the cache key changes, not on every evaluation
      const outerMap = $relatedColumnValues;
      const nestedMap = outerMap?.get(relatedColumnId);
      const hasValue =
        nestedMap?.getValue(String(rowPkForRelatedColumn)) !== undefined;

      // If we don't have a value and we previously verified this cache key,
      // the map was likely cleared/repopulated, so clear the cache
      if (!hasValue && lastVerifiedCacheKey === cacheKey) {
        nestedStoreCache.clear();
        lastVerifiedCacheKey = null;
      } else if (hasValue) {
        lastVerifiedCacheKey = cacheKey;
      }

      // Check if we already have this store cached
      if (!nestedStoreCache.has(cacheKey)) {
        // Get the nested map store - this subscribes to the outer map
        const nestedMapReadable =
          relatedColumnValues.derivedValue(relatedColumnId);

        // Create a derived store that gets the inner value store from the nested map
        const innerValueStoreReadable = derived(
          nestedMapReadable,
          (nestedMap) => {
            if (!nestedMap) return null;
            // nestedMap is a WritableMap, get its derivedValue store for this row
            return nestedMap.derivedValue(String(rowPkForRelatedColumn));
          },
        );

        // Flatten the nested Readable structure
        const valueStore = flattenNestedReadable(innerValueStoreReadable);
        nestedStoreCache.set(cacheKey, valueStore);
      }
    }

    return nestedStoreCache.get(cacheKey);
  })();

  // Subscribe to the final value
  $: relatedColumnValue = relatedColumnValueStore
    ? $relatedColumnValueStore
    : undefined;

  // Clean up cache when component is destroyed
  onDestroy(() => {
    nestedStoreCache.clear();
  });
  // For list aggregation, get summaries from the dedicated relatedColumnSummaries store
  // This store persists summaries across refetches, ensuring they don't disappear when sorting changes
  $: relatedColumnRecordSummaries = (() => {
    if (
      processedColumn instanceof RelatedColumn &&
      processedColumn.aggregation === 'list' &&
      !isPlaceholderRecordRow(row)
    ) {
      // First, try to get summaries from the dedicated store
      const columnSummariesMap = relatedColumnSummaries.getValue(
        String(column.id),
      );
      if (columnSummariesMap) {
        // Convert WritableMap to regular Map for the component
        const summaries = new Map<string, string>();
        for (const [key, summary] of columnSummariesMap.getEntries()) {
          summaries.set(key, summary);
        }
        if (summaries.size > 0) {
          return summaries;
        }
      }

      // Fallback: extract from relatedColumnValue if not in store
      if (
        relatedColumnValue !== undefined &&
        relatedColumnValue !== null &&
        Array.isArray(relatedColumnValue) &&
        relatedColumnValue.length > 0 &&
        typeof relatedColumnValue[0] === 'object' &&
        relatedColumnValue[0] !== null &&
        'id' in relatedColumnValue[0] &&
        'value' in relatedColumnValue[0]
      ) {
        const summariesMap = new Map<string, string>();
        (
          relatedColumnValue as Array<{
            id: unknown;
            value: unknown;
          }>
        ).forEach((item) => {
          const idString = String(item.id);
          if (
            item.value !== null &&
            item.value !== undefined &&
            item.value !== ''
          ) {
            summariesMap.set(idString, String(item.value));
          } else {
            summariesMap.set(idString, idString);
          }
        });
        return summariesMap;
      }
    }
    return new Map<string, string>();
  })();

  $: effectiveValue = (() => {
    if (
      processedColumn instanceof RelatedColumn &&
      !isPlaceholderRecordRow(row) &&
      relatedColumnValue !== undefined
    ) {
      // Handle list aggregation - extract ids array from unified structure
      if (processedColumn.aggregation === 'list') {
        if (
          Array.isArray(relatedColumnValue) &&
          relatedColumnValue.length > 0 &&
          typeof relatedColumnValue[0] === 'object' &&
          relatedColumnValue[0] !== null &&
          'id' in relatedColumnValue[0] &&
          'value' in relatedColumnValue[0]
        ) {
          const ids = (
            relatedColumnValue as Array<{ id: unknown; value: unknown }>
          ).map((item) => item.id);
          return ids;
        }
        return null;
      }
      return relatedColumnValue;
    }
    return value;
  })();

  $: recordSummary = $linkedRecordSummaries
    .get(String(column.id))
    ?.get(String(effectiveValue));
  $: fileManifest = (() => {
    if (!column.metadata?.file_backend) return undefined;
    const fileReference = parseFileReference(effectiveValue);
    if (!fileReference) return undefined;
    return $fileManifests.get(String(column.id))?.get(fileReference.mash);
  })();

  async function setValue(newValue: unknown) {
    // Don't allow editing related columns for now
    if (processedColumn instanceof RelatedColumn) {
      return;
    }
    if (newValue === value) {
      return;
    }
    value = newValue;
    // Type guard: ensure we have a ProcessedColumn (not RelatedColumn)
    if (processedColumn instanceof RelatedColumn) {
      return;
    }
    // At this point, processedColumn is ProcessedColumn, so column is RawColumnWithMetadata
    const updatedRow = isProvisionalRecordRow(row)
      ? await recordsData.createOrUpdateRecord(row, processedColumn.column)
      : await recordsData.updateCell(row, processedColumn.column);
    value = updatedRow.record?.[processedColumn.column.id] ?? value;
  }

  function focus() {
    selection.update((s) => s.ofOneCell(cellId));
  }

  async function valueUpdated(e: CustomEvent<{ value: unknown }>) {
    await setValue(e.detail.value);
    focus();
  }
</script>

<SheetDataCell
  columnIdentifierKey={column.id}
  cellSelectionId={cellId}
  selection={$selection}
  {isWithinPlaceholderRow}
  let:isActive
>
  <CellBackground
    when={hasServerError || (!isActive && hasClientError)}
    color="var(--cell-bg-color-error)"
  />
  <CellBackground when={!isEditable} color="var(--cell-bg-color-disabled)" />
  {#if !(isEditable && isActive)}
    <!--
    We hide these backgrounds when the cell is editable and active because a
    white background better communicates that the user can edit the active
    cell.
  -->
    <RowCellBackgrounds hasErrors={rowHasErrors} />
  {/if}

  <CellFabric
    columnFabric={effectiveProcessedColumn}
    {isActive}
    value={effectiveValue}
    {isProcessing}
    {canViewLinkedEntities}
    {fileManifest}
    setFileManifest={(mash, manifest) => {
      recordsData.fileManifests.addBespokeValue({
        columnId: String(columnId),
        key: mash,
        value: manifest,
      });
    }}
    {recordSummary}
    recordSummaries={processedColumn instanceof RelatedColumn &&
    processedColumn.aggregation === 'list'
      ? relatedColumnRecordSummaries
      : undefined}
    setRecordSummary={(recordId, rs) => {
      linkedRecordSummaries.addBespokeValue({
        columnId: String(columnId),
        key: recordId,
        value: rs,
      });
      // Also update centralized cache if this is a RelatedColumn with list aggregation
      if (
        processedColumn instanceof RelatedColumn &&
        processedColumn.aggregation === 'list' &&
        tabularData &&
        $tabularData
      ) {
        $tabularData.recordSummariesCache.updateSummary(
          processedColumn.targetTableOid,
          recordId,
          rs,
        );
      }
    }}
    intermediateTableOid={processedColumn instanceof RelatedColumn &&
    processedColumn.aggregation === 'list'
      ? processedColumn.intermediateTableInfo?.intermediateTableOid
      : undefined}
    fkToBaseAttnum={processedColumn instanceof RelatedColumn &&
    processedColumn.aggregation === 'list'
      ? processedColumn.intermediateTableInfo?.fkToBaseAttnum
      : undefined}
    fkToTargetAttnum={processedColumn instanceof RelatedColumn &&
    processedColumn.aggregation === 'list'
      ? processedColumn.intermediateTableInfo?.fkToTargetAttnum
      : undefined}
    baseTableRowPk={processedColumn instanceof RelatedColumn &&
    processedColumn.aggregation === 'list' &&
    !isPlaceholderRecordRow(row)
      ? rowPkForRelatedColumn
      : undefined}
    cellKey={processedColumn instanceof RelatedColumn &&
    processedColumn.aggregation === 'list'
      ? key
      : undefined}
    modificationStatusMap={processedColumn instanceof RelatedColumn &&
    processedColumn.aggregation === 'list'
      ? modificationStatusMap
      : undefined}
    showAsSkeleton={$recordsDataState === States.Loading}
    disabled={!isEditable}
    on:movementKeyDown={({ detail }) =>
      handleKeyboardEventOnCell(detail.originalEvent, selection)}
    on:update={valueUpdated}
    horizontalAlignment={column.primary_key ? 'left' : undefined}
    lightText={hasError || isProcessing}
  />

  {#if errors.length}
    <CellErrors {serverErrors} {clientErrors} forceShowErrors={isActive} />
  {/if}
</SheetDataCell>
