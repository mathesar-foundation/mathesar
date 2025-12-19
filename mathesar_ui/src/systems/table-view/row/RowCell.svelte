<script lang="ts">
  import type { Writable } from 'svelte/store';

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
    type JoinedColumn,
    type ProcessedColumn,
    type RecordRow,
    type RecordsData,
    getRowSelectionId,
    isJoinedColumn,
    isPlaceholderRecordRow,
    isProvisionalRecordRow,
  } from '@mathesar/stores/table-data';
  import type { NewCellValueRecipe } from '@mathesar/stores/table-data/records';
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
  export let columnFabric: ProcessedColumn | JoinedColumn;
  export let clientSideErrorMap: WritableMap<CellKey, ClientSideCellError[]>;
  export let value: unknown = undefined;
  export let canUpdateRecords: boolean;

  $: effectiveColumnFabric =
    isProvisionalRecordRow(row) && !isJoinedColumn(columnFabric)
      ? columnFabric.withoutEnhancedPkCell()
      : columnFabric;
  $: cellId = makeCellId(getRowSelectionId(row), effectiveColumnFabric.id);

  // To be used in case of publicly shared links where user should not be able
  // to view linked tables & explorations
  const canViewLinkedEntities = true;

  $: recordsDataState = recordsData.state;
  $: ({
    linkedRecordSummaries,
    joinedRecordSummaries,
    fileManifests,
    newRecords,
  } = recordsData);
  $: ({ column } = effectiveColumnFabric);
  $: columnId = effectiveColumnFabric.id;
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
  $: isEditable = canUpdateRecords && effectiveColumnFabric.isEditable;
  $: recordSummary = $linkedRecordSummaries.get(columnId)?.get(String(value));
  $: joinedRecordSummariesMap = isJoinedColumn(effectiveColumnFabric)
    ? $joinedRecordSummaries.get(columnId)
    : undefined;
  $: fileManifest = (() => {
    if (!column.metadata?.file_backend) return undefined;
    const fileReference = parseFileReference(value);
    if (!fileReference) return undefined;
    return $fileManifests.get(columnId)?.get(fileReference.mash);
  })();
  $: isPrimaryKey = 'primary_key' in column && column.primary_key;

  async function setValue(newValue: unknown) {
    if (newValue === value) return;
    const cells: NewCellValueRecipe[] = [{ columnId, value: newValue }];
    await recordsData.bulkDml(
      isWithinPlaceholderRow
        ? { modificationRecipes: [], additionRecipes: [{ cells }] }
        : { modificationRecipes: [{ row, cells }], additionRecipes: [] },
    );
    if (isWithinPlaceholderRow) {
      // Re-focus the cell just edited. The placeholder row requires this extra
      // logic because it gets a new id value after it's saved, and that ends up
      // wiping out the fact that a cell in that row was selected.
      const newRowId = $newRecords[$newRecords.length - 1].identifier;
      selection.update((s) =>
        s.ofRowColumnIntersection([newRowId], [columnId]),
      );
    }
  }
</script>

<SheetDataCell
  columnIdentifierKey={columnId}
  cellSelectionId={cellId}
  selection={$selection}
  {isWithinPlaceholderRow}
  isRangeRestricted={isJoinedColumn(columnFabric)}
  let:isActive
>
  <CellBackground
    when={isJoinedColumn(columnFabric)}
    color="var(--cell-bg-color-joined-cell)"
  />
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
    columnFabric={effectiveColumnFabric}
    {isActive}
    {value}
    {setValue}
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
    setRecordSummary={(recordId, rs) =>
      linkedRecordSummaries.addBespokeValue({
        columnId: String(columnId),
        key: recordId,
        value: rs,
      })}
    {joinedRecordSummariesMap}
    showAsSkeleton={$recordsDataState === States.Loading}
    disabled={!isEditable}
    on:movementKeyDown={({ detail }) =>
      handleKeyboardEventOnCell(detail.originalEvent, selection)}
    horizontalAlignment={isPrimaryKey ? 'left' : undefined}
    lightText={hasError || isProcessing}
  />

  {#if errors.length}
    <CellErrors {serverErrors} {clientErrors} forceShowErrors={isActive} />
  {/if}
</SheetDataCell>
