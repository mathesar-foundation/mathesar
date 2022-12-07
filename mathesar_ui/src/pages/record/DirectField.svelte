<script lang="ts">
  import {
    ButtonMenuItem,
    DropdownMenu,
    iconExpandDown,
    Label,
    LabelController,
  } from '@mathesar/component-library';
  import type { CellDataType } from '@mathesar/components/cell-fabric/data-types/typeDefinitions';
  import DynamicInput from '@mathesar/components/cell-fabric/DynamicInput.svelte';
  import ProcessedColumnName from '@mathesar/components/column/ProcessedColumnName.svelte';
  import type { FieldStore } from '@mathesar/components/form';
  import FieldErrors from '@mathesar/components/form/FieldErrors.svelte';
  import Null from '@mathesar/components/Null.svelte';
  import { iconSetToNull } from '@mathesar/icons';
  import type { ProcessedColumn } from '@mathesar/stores/table-data';
  import type RecordStore from './RecordStore';

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

  export let record: RecordStore;
  export let processedColumn: ProcessedColumn;
  export let field: FieldStore;

  $: ({ recordSummaries } = record);
  $: ({ column, abstractType } = processedColumn);
  $: value = $field;
  $: ({ showsError } = field);
  $: disabled = column.primary_key;
  $: shouldDisplayNullOverlay = !cellDataTypesThatUsePlaceholderText.has(
    abstractType.cellInfo.type,
  );
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
          ariaLabel="{column.name} Field Options"
          icon={iconExpandDown}
        >
          <ButtonMenuItem
            icon={iconSetToNull}
            on:click={() => field.set(null)}
            disabled={column.primary_key}
          >
            Set to <Null />
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
        recordSummaries.addBespokeRecordSummary({
          columnId: String(column.id),
          recordId,
          recordSummary,
        })}
      hasError={$showsError}
    />
    <FieldErrors {field} />
  </div>
</div>

<style>
  .direct-field {
    display: contents;
    --alert-margin: 0.5rem 0 0 0;
  }
  .direct-field:not(:last-child) .cell {
    padding-bottom: 1rem;
    margin-bottom: 1rem;
    border-bottom: solid var(--color-gray-light) 1px;
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
