<script lang="ts">
  import type { Writable } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import {
    type RequestStatus,
    States,
  } from '@mathesar/api/rest/utils/requestUtils';
  import type { ResultValue } from '@mathesar/api/rpc/records';
  import type { TablePrivilege } from '@mathesar/api/rpc/tables';
  import CellFabric from '@mathesar/components/cell-fabric/CellFabric.svelte';
  import CellBackground from '@mathesar/components/CellBackground.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import RowCellBackgrounds from '@mathesar/components/RowCellBackgrounds.svelte';
  import { SheetDataCell } from '@mathesar/components/sheet';
  import { makeCellId } from '@mathesar/components/sheet/cellIds';
  import type SheetSelection from '@mathesar/components/sheet/selection/SheetSelection';
  import { handleKeyboardEventOnCell } from '@mathesar/components/sheet/sheetKeyboardUtils';
  import { iconLinkToRecordPage, iconSetToNull } from '@mathesar/icons';
  import type { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import {
    type CellKey,
    type ClientSideCellError,
    type ProcessedColumn,
    type RecordRow,
    type RecordsData,
    getRowSelectionId,
    isProvisionalRecordRow,
  } from '@mathesar/stores/table-data';
  import {
    ButtonMenuItem,
    ContextMenu,
    LinkMenuItem,
    MenuDivider,
    MenuHeading,
    type WritableMap,
  } from '@mathesar-component-library';

  import ColumnHeaderContextMenu from '../header/header-cell/ColumnHeaderContextMenu.svelte';

  import CellErrors from './CellErrors.svelte';
  import RowContextOptions from './RowContextOptions.svelte';

  export let recordsData: RecordsData;
  export let selection: Writable<SheetSelection>;
  export let row: RecordRow;
  export let recordPk: ResultValue | undefined;
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
  export let canDeleteRecords: boolean;

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
  $: ({ linkedRecordSummaries } = recordsData);
  $: ({ column, linkFk } = effectiveProcessedColumn);
  $: columnId = column.id;
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
  $: canSetNull = isEditable && column.nullable && value !== null;
  $: getRecordPageUrl = $storeToGetRecordPageUrl;
  $: linkedRecordHref = linkFk
    ? getRecordPageUrl({ tableId: linkFk.referent_table_oid, recordId: value })
    : undefined;
  $: showLinkedRecordHyperLink = linkedRecordHref && canViewLinkedEntities;
  $: recordSummary = $linkedRecordSummaries
    .get(String(column.id))
    ?.get(String(value));

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

  async function valueUpdated(e: CustomEvent<{ value: unknown }>) {
    await setValue(e.detail.value);
  }
</script>

<SheetDataCell
  columnIdentifierKey={column.id}
  cellSelectionId={cellId}
  selection={$selection}
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
    {value}
    {isProcessing}
    {canViewLinkedEntities}
    {recordSummary}
    setRecordSummary={(recordId, rs) =>
      linkedRecordSummaries.addBespokeRecordSummary({
        columnId: String(columnId),
        recordId,
        recordSummary: rs,
      })}
    showAsSkeleton={$recordsDataState === States.Loading}
    disabled={!isEditable}
    on:movementKeyDown={({ detail }) =>
      handleKeyboardEventOnCell(detail.originalEvent, selection)}
    on:update={valueUpdated}
    horizontalAlignment={column.primary_key ? 'left' : undefined}
    lightText={hasError || isProcessing}
  />
  <ContextMenu>
    <MenuHeading>{$_('cell')}</MenuHeading>
    <ButtonMenuItem
      icon={iconSetToNull}
      disabled={!canSetNull}
      on:click={() => setValue(null)}
    >
      {$_('set_to')}
      <Null />
    </ButtonMenuItem>
    {#if showLinkedRecordHyperLink && linkedRecordHref}
      <LinkMenuItem icon={iconLinkToRecordPage} href={linkedRecordHref}>
        <RichText text={$_('open_named_record')} let:slotName>
          {#if slotName === 'recordName'}
            <Identifier>{recordSummary}</Identifier>
          {/if}
        </RichText>
      </LinkMenuItem>
    {/if}
    <MenuDivider />

    <!-- Column Attributes -->
    <MenuHeading>{$_('column')}</MenuHeading>
    <ColumnHeaderContextMenu processedColumn={effectiveProcessedColumn} />

    <!-- Row -->
    <MenuDivider />
    <MenuHeading>{$_('row')}</MenuHeading>
    <RowContextOptions {recordPk} {recordsData} {row} {canDeleteRecords} />
  </ContextMenu>
  {#if errors.length}
    <CellErrors {serverErrors} {clientErrors} forceShowErrors={isActive} />
  {/if}
</SheetDataCell>
