<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { CellDataType } from '@mathesar/components/cell-fabric/data-types/typeDefinitions';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import { parseFileReference } from '@mathesar/components/file-attachments/fileUtils';
  import type { FieldStore } from '@mathesar/components/form';
  import FieldErrors from '@mathesar/components/form/FieldErrors.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import {
    iconDescription,
    iconLinkToRecordPage,
    iconModalRecordView,
    iconSetToNull,
  } from '@mathesar/icons';
  import { storeToGetRecordPageUrl } from '@mathesar/stores/storeBasedUrls';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import { currentTablesMap } from '@mathesar/stores/tables';
  import { modalRecordViewContext } from '@mathesar/systems/record-view-modal/modalRecordViewContext';
  import {
    ButtonMenuItem,
    DropdownMenu,
    Icon,
    Label,
    LabelController,
    LinkMenuItem,
    iconExpandDown,
  } from '@mathesar-component-library';
  import Tooltip from '@mathesar-component-library-dir/tooltip/Tooltip.svelte';

  import RecordStore from './RecordStore';

  /**
   * This is used to determine whether to display a `NULL` overlay indicator.
   * For text data types the indicator is important because otherwise the user
   * has no way to distinguish an empty string from a `NULL` value. But for some
   * data types (e.g. Date), we can't show the indicator because the input
   * component already shows placeholder text to guide the user towards the
   * required formatting.
   *
   * TODO: Refactor this logic. Invert control. Each data type should define a
   * common param to indicate how a NULL value should be displayed over its
   * input component. Then we should grab onto that param within this component.
   * The pattern we're currently using is brittle because if we add new data
   * types we shouldn't need to update this code here.
   */
  const cellDataTypesThatUsePlaceholderText = new Set<CellDataType>([
    'date',
    'datetime',
    'duration',
    'time',
  ]);
  const labelController = new LabelController();
  const modalRecordView = modalRecordViewContext.get();

  export let record: RecordStore;
  export let processedColumn: ProcessedColumn;
  export let field: FieldStore;
  export let canUpdateTableRecords = true;

  $: ({ recordSummaries, fileManifests } = record);
  $: ({ column, abstractType, linkFk } = processedColumn);
  $: canUpdateColumn = processedColumn.currentRolePrivileges.has('UPDATE');
  $: value = $field;
  $: fieldIsDisabled = field.disabled;
  $: ({ showsError } = field);
  $: disabled =
    column.primary_key ||
    $fieldIsDisabled ||
    !canUpdateTableRecords ||
    !canUpdateColumn;
  $: shouldDisplayNullOverlay = !cellDataTypesThatUsePlaceholderText.has(
    abstractType.cellInfo.type,
  );
  $: getRecordUrl = $storeToGetRecordPageUrl;
  $: fileManifest = (() => {
    if (!column.metadata?.file_backend) return undefined;
    const fileReference = parseFileReference(value);
    if (!fileReference) return undefined;
    return $fileManifests.get(String(column.id))?.get(fileReference.mash);
  })();

  function quickViewRecord() {
    if (!modalRecordView) return;
    if (value === undefined) return;
    const tableOid = linkFk?.referent_table_oid;
    if (!tableOid) return;
    const containingTable = $currentTablesMap.get(tableOid);
    if (!containingTable) return;
    const recordStore = new RecordStore({
      table: containingTable,
      recordPk: String(value),
    });
    modalRecordView.open(recordStore);
  }
</script>

<div class="direct-field">
  <div class="left cell">
    <div class="complex-label">
      <div class="label-with-info">
        <Label controller={labelController}>
          <ProcessedColumnName {processedColumn} />
        </Label>
        {#if processedColumn.column.description}
          <Tooltip placements={['right']}>
            <span
              slot="trigger"
              class="info-icon"
              aria-label={$_('column_description')}
            >
              <Icon {...iconDescription} />
            </span>
            <div slot="content">
              {processedColumn.column.description}
            </div>
          </Tooltip>
        {/if}
      </div>
      <div class="options">
        <DropdownMenu
          showArrow={false}
          triggerAppearance="plain"
          closeOnInnerClick={true}
          ariaLabel={$_('column_field_options', {
            values: { columnName: column.name },
          })}
          icon={iconExpandDown}
        >
          {#if linkFk}
            <ButtonMenuItem
              icon={iconModalRecordView}
              on:click={quickViewRecord}
            >
              {$_('quick_view_linked_record')}
            </ButtonMenuItem>
            {@const linkedRecordUrl = getRecordUrl({
              tableId: linkFk.referent_table_oid,
              recordId: value,
            })}
            {#if linkedRecordUrl}
              <LinkMenuItem href={linkedRecordUrl} icon={iconLinkToRecordPage}>
                {$_('open_linked_record')}
              </LinkMenuItem>
            {/if}
          {/if}
          <ButtonMenuItem
            icon={iconSetToNull}
            on:click={() => field.set(null)}
            {disabled}
          >
            <RichText
              text={$_('set_count_cells_to_value', { values: { count: 1 } })}
              let:slotName
            >
              {#if slotName === 'value'}
                <Null />
              {/if}
            </RichText>
          </ButtonMenuItem>
        </DropdownMenu>
      </div>
    </div>
  </div>

  <div class="input cell">
    {#if $field === null && shouldDisplayNullOverlay}
      <div class="null">
        <Null />
      </div>
    {/if}
    <DynamicInput
      bind:value={$field}
      {disabled}
      componentAndProps={processedColumn.inputComponentAndProps}
      {labelController}
      recordSummary={$recordSummaries
        .get(String(column.id))
        ?.get(String(value))}
      setRecordSummary={(recordId, recordSummary) =>
        recordSummaries.addBespokeValue({
          columnId: String(column.id),
          key: recordId,
          value: recordSummary,
        })}
      {fileManifest}
      setFileManifest={(mash, manifest) => {
        fileManifests.addBespokeValue({
          columnId: String(column.id),
          key: mash,
          value: manifest,
        });
      }}
      hasError={$showsError}
      allowsHyperlinks
    />
    <FieldErrors {field} />
  </div>
</div>

<style>
  .direct-field {
    display: contents;
  }

  .direct-field:not(:last-child) .cell {
    padding-bottom: 1rem;
    margin-bottom: 1.25rem;
    border-bottom: 1px solid var(--color-border-section);
  }

  .left {
    display: flex;
    align-items: flex-start;
    justify-content: flex-end;
    padding-right: 0.75rem;
  }

  .complex-label {
    display: flex;
    flex-direction: row;
    justify-content: space-between;
    max-width: 15rem;
    gap: 0.3rem;
  }

  .label-with-info {
    display: inline-flex;
    align-items: center;
    gap: 0.35rem;
    overflow: hidden;
    min-width: 0;
  }

  .label-with-info :global(label) {
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    min-width: 0;
  }

  .info-icon {
    font-size: 0.85rem;
    color: var(--color-fg-muted);
    cursor: help;
    user-select: none;
    flex-shrink: 0;
  }

  .info-icon:hover {
    color: var(--color-fg);
  }

  .input {
    position: relative;
    isolation: isolate;
  }

  .null {
    position: absolute;
    z-index: 2;
    top: 0.5rem;
    left: 0.8rem;
    pointer-events: none;
  }
</style>
