<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { CellDataType } from '@mathesar/components/cell-fabric/data-types/typeDefinitions';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import type { FieldStore } from '@mathesar/components/form';
  import FieldErrors from '@mathesar/components/form/FieldErrors.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import {
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
    Label,
    LabelController,
    LinkMenuItem,
    iconExpandDown,
  } from '@mathesar-component-library';

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

  $: ({ recordSummaries } = record);
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
      <div class="label">
        <Label controller={labelController}>
          <ProcessedColumnName {processedColumn} />
        </Label>
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
            {$_('set_to')}
            <Null />
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
    margin-bottom: 1rem;
    border-bottom: solid var(--border-color) 1px;
  }
  .left {
    display: flex;
    align-items: flex-start;
    justify-content: end;
  }
  .complex-label {
    display: flex;
    align-items: center;
    justify-content: end;
    max-width: 15rem;
    overflow: hidden;
  }
  .label {
    overflow: hidden;
  }
  .options {
    margin: 0 0.2rem;
  }
  .input {
    position: relative;
    isolation: isolate;
  }
  .input > :global(*) {
    position: relative;
    z-index: 1;
  }
  .null {
    position: absolute;
    z-index: 2;
    top: 0.5rem;
    left: 0.8rem;
    pointer-events: none;
  }
</style>
