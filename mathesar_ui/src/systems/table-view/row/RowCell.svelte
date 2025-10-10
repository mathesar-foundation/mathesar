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
  import { getSheetContext } from '@mathesar/components/sheet/utils';
  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import {
    type CellKey,
    type ClientSideCellError,
    type ProcessedColumn,
    type RecordRow,
    type RecordsData,
    getRowSelectionId,
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
  export let processedColumn: ProcessedColumn;
  export let clientSideErrorMap: WritableMap<CellKey, ClientSideCellError[]>;
  export let value: unknown = undefined;
  export let canUpdateRecords: boolean;

  const { stores, api } = getSheetContext();
  const { editingCellId } = stores;

  $: effectiveProcessedColumn = isProvisionalRecordRow(row)
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
  $: ({ linkedRecordSummaries, fileManifests } = recordsData);
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
  $: recordSummary = $linkedRecordSummaries
    .get(String(column.id))
    ?.get(String(value));
  $: fileManifest = (() => {
    if (!column.metadata?.file_backend) return undefined;
    const fileReference = parseFileReference(value);
    if (!fileReference) return undefined;
    return $fileManifests.get(String(column.id))?.get(fileReference.mash);
  })();

  async function setValue(newValue: unknown) {
    if (newValue === value) {
      return;
    }
    value = newValue;
    const updatedRow = isProvisionalRecordRow(row)
      ? await recordsData.createOrUpdateRecord(row, column)
      : await recordsData.updateCell(row, column);
    value = updatedRow.record?.[column.id] ?? value;
  }

  function focus() {
    selection.update((s) => s.ofOneCell(cellId));
  }

  async function valueUpdated(e: CustomEvent<{ value: unknown }>) {
    await setValue(e.detail.value);
    focus();
  }

  function handleEnterEditMode() {
    api.setEditingCellId(cellId);
  }

  function handleExitEditMode() {
    api.setEditingCellId(undefined);
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
    isEditMode={cellId === $editingCellId}
    {value}
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
    showAsSkeleton={$recordsDataState === States.Loading}
    disabled={!isEditable}
    on:movementKeyDown={({ detail }) =>
      handleKeyboardEventOnCell(detail.originalEvent, selection)}
    on:update={valueUpdated}
    on:enterEditMode={handleEnterEditMode}
    on:exitEditMode={handleExitEditMode}
    horizontalAlignment={column.primary_key ? 'left' : undefined}
    lightText={hasError || isProcessing}
  />

  {#if errors.length}
    <CellErrors {serverErrors} {clientErrors} forceShowErrors={isActive} />
  {/if}
</SheetDataCell>
