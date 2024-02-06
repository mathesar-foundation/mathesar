<script lang="ts">
  import { tick } from 'svelte';
  import { _ } from 'svelte-i18n';
  import type { Writable } from 'svelte/store';

  import {
    ButtonMenuItem,
    ContextMenu,
    LinkMenuItem,
    MenuDivider,
    MenuHeading,
    WritableMap,
  } from '@mathesar-component-library';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import { States } from '@mathesar/api/utils/requestUtils';
  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import RowCellBackgrounds from '@mathesar/components/RowCellBackgrounds.svelte';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import {
    SheetCell,
    scrollBasedOnActiveCell,
  } from '@mathesar/components/sheet';
  import { makeCellId } from '@mathesar/components/sheet/cellIds';
  import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
  import { iconLinkToRecordPage, iconSetToNull } from '@mathesar/icons';
  import { currentDatabase } from '@mathesar/stores/databases';
  import { currentSchema } from '@mathesar/stores/schemas';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    rowHasNewRecord,
    type CellKey,
    type ProcessedColumn,
    type RecordRow,
    type RecordsData,
  } from '@mathesar/stores/table-data';
  import { getRowSelectionId } from '@mathesar/stores/table-data/records';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import ColumnHeaderContextMenu from '../header/header-cell/ColumnHeaderContextMenu.svelte';
  import CellErrors from './CellErrors.svelte';
  import RowContextOptions from './RowContextOptions.svelte';
  import { handleKeyboardEventOnCell } from '@mathesar/components/sheet/sheetKeyboardUtils';

  export let recordsData: RecordsData;
  export let selection: Writable<SheetSelection>;
  export let row: RecordRow;
  export let rowHasErrors = false;
  export let key: CellKey;
  export let modificationStatusMap: WritableMap<CellKey, RequestStatus>;
  export let processedColumn: ProcessedColumn;
  export let clientSideErrorMap: WritableMap<CellKey, string[]>;
  export let value: unknown = undefined;
  export let rowKey: string;

  const userProfile = getUserProfileStoreFromContext();

  $: cellId = makeCellId(getRowSelectionId(row), String(processedColumn.id));
  $: database = $currentDatabase;
  $: schema = $currentSchema;
  $: canEditTableRecords = !!$userProfile?.hasPermission(
    { database, schema },
    'canEditTableRecords',
  );
  $: canViewLinkedEntities = !!$userProfile?.hasPermission(
    { database, schema },
    'canViewLinkedEntities',
  );
  $: recordsDataState = recordsData.state;
  $: ({ recordSummaries } = recordsData);
  $: ({ column, linkFk } = processedColumn);
  $: columnId = column.id;
  $: isActive = $selection.activeCellId === cellId;
  $: isSelected = $selection.cellIds.has(cellId);
  $: modificationStatus = $modificationStatusMap.get(key);
  $: serverErrors =
    modificationStatus?.state === 'failure' ? modificationStatus?.errors : [];
  $: clientErrors = $clientSideErrorMap.get(key) ?? [];
  $: errors = [...serverErrors, ...clientErrors];
  $: canSetNull = column.nullable && value !== null;
  $: hasError = !!errors.length;
  $: isProcessing = modificationStatus?.state === 'processing';
  $: isEditable = !column.primary_key && canEditTableRecords;
  $: getRecordPageUrl = $storeToGetRecordPageUrl;
  $: linkedRecordHref = linkFk
    ? getRecordPageUrl({ tableId: linkFk.referent_table, recordId: value })
    : undefined;
  $: showLinkedRecordHyperLink = linkedRecordHref && canViewLinkedEntities;

  async function setValue(newValue: unknown) {
    if (newValue === value) {
      return;
    }
    value = newValue;
    const updatedRow = rowHasNewRecord(row)
      ? await recordsData.createOrUpdateRecord(row, column)
      : await recordsData.updateCell(row, column);
    value = updatedRow.record?.[column.id] ?? value;
  }

  async function valueUpdated(e: CustomEvent<{ value: unknown }>) {
    await setValue(e.detail.value);
  }
</script>

<SheetCell columnIdentifierKey={column.id} let:htmlAttributes let:style>
  <div
    class="cell editable-cell"
    class:error={hasError}
    class:modified={modificationStatus?.state === 'success'}
    class:is-active={isActive}
    class:is-processing={isProcessing}
    class:is-pk={column.primary_key}
    class:is-selected={isSelected}
    {...htmlAttributes}
    {style}
  >
    <CellBackground when={hasError} color="var(--cell-bg-color-error)" />
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
      columnFabric={processedColumn}
      {isActive}
      {isSelected}
      {value}
      {isProcessing}
      {canViewLinkedEntities}
      recordSummary={$recordSummaries
        .get(String(column.id))
        ?.get(String(value))}
      setRecordSummary={(recordId, recordSummary) =>
        recordSummaries.addBespokeRecordSummary({
          columnId: String(columnId),
          recordId,
          recordSummary,
        })}
      showAsSkeleton={$recordsDataState === States.Loading}
      disabled={!isEditable}
      on:movementKeyDown={({ detail }) =>
        handleKeyboardEventOnCell(detail.originalEvent, selection)}
      on:activate={() => selection.update((s) => s.ofOneCell(cellId))}
      on:update={valueUpdated}
      horizontalAlignment={column.primary_key ? 'left' : undefined}
      on:onSelectionStart={() => {
        // // TODO_3037
        // selection.onStartSelection(row, processedColumn);
      }}
      on:onMouseEnterCellWhileSelection={() => {
        // // This enables the click + drag to
        // // select multiple cells
        // //
        // // TODO_3037
        // //
        // selection.onMouseEnterCellWhileSelection(row, processedColumn);
      }}
    />
    <ContextMenu>
      {#if canEditTableRecords || showLinkedRecordHyperLink}
        <MenuHeading>{$_('cell')}</MenuHeading>
        {#if canEditTableRecords}
          <ButtonMenuItem
            icon={iconSetToNull}
            disabled={!canSetNull}
            on:click={() => setValue(null)}
          >
            {$_('set_to')}
            <Null />
          </ButtonMenuItem>
        {/if}
        {#if showLinkedRecordHyperLink && linkedRecordHref}
          <LinkMenuItem icon={iconLinkToRecordPage} href={linkedRecordHref}>
            {$_('go_to_linked_record')}
          </LinkMenuItem>
        {/if}
        <MenuDivider />
      {/if}

      <!-- Column Attributes -->
      <MenuHeading>{$_('column')}</MenuHeading>
      <ColumnHeaderContextMenu {processedColumn} />

      <!-- Row -->
      {#if canEditTableRecords || showLinkedRecordHyperLink}
        <MenuDivider />
        <MenuHeading>{$_('row')}</MenuHeading>
        <RowContextOptions recordPk={rowKey} {recordsData} {row} />
      {/if}
    </ContextMenu>
    {#if errors.length}
      <CellErrors {errors} forceShowErrors={isActive} />
    {/if}
  </div>
</SheetCell>

<style lang="scss">
  .editable-cell.cell {
    user-select: none;
    -webkit-user-select: none; /* Safari */
    background: var(--cell-bg-color-base);
    &.is-active {
      z-index: var(--z-index__sheet__active-cell);
      border-color: transparent;
      min-height: 100%;
      height: auto !important;
    }
    &.error,
    &.is-processing {
      color: var(--cell-text-color-processing);
    }
  }
</style>
