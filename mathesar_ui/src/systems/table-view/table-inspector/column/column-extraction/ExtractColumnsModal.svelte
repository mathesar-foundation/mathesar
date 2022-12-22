<script lang="ts">
  import { tick } from 'svelte';
  import { get } from 'svelte/store';

  import { ControlledModal } from '@mathesar-component-library';
  import {
    comboValidator,
    Field,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import FieldLayout from '@mathesar/components/form/FieldLayout.svelte';
  import OutcomeBox from '@mathesar/components/message-boxes/OutcomeBox.svelte';
  import SelectProcessedColumns from '@mathesar/components/SelectProcessedColumns.svelte';
  import { scrollBasedOnSelection } from '@mathesar/components/sheet';
  import {
    getTabularDataStoreFromContext,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import {
    currentTable,
    getTableFromStoreOrApi,
    moveColumns,
    splitTable,
    tables as tablesDataStore,
    validateNewTableName,
  } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import {
    columnNameIsAvailable,
    getSuggestedFkColumnName,
  } from '@mathesar/utils/columnUtils';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import type { LinkedTable } from './columnExtractionTypes';
  import {
    getLinkedTables,
    validateTableIsNotLinkedViaSelectedColumn,
  } from './columnExtractionUtils';
  import CurrentTable from './CurrentTable.svelte';
  import type { ExtractColumnsModalController } from './ExtractColumnsModalController';
  import SelectLinkedTable from './SelectLinkedTable.svelte';
  import SuccessToastContent from './SuccessToastContent.svelte';
  import TargetTable from './TargetTable.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let controller: ExtractColumnsModalController;

  $: ({ processedColumns, constraintsDataStore, selection } = $tabularData);
  $: ({ constraints } = $constraintsDataStore);
  $: availableProcessedColumns = [...$processedColumns.values()];
  $: ({ targetType, columns, isOpen } = controller);
  $: selectedColumnNames = new Set($columns.map((c) => c.column.name));
  $: availableColumns = availableProcessedColumns
    .map((c) => c.column)
    .filter((c) => !selectedColumnNames.has(c.name));
  $: linkedTable = requiredField<LinkedTable | undefined>(undefined);
  $: tableName = requiredField('', [$validateNewTableName]);
  $: newFkColumnName = requiredField('', [
    columnNameIsAvailable(availableColumns),
  ]);
  $: targetTableName =
    $targetType === 'newTable' ? $tableName : $linkedTable?.table.name ?? '';

  $: form =
    $targetType === 'newTable'
      ? makeForm({ columns, tableName, newFkColumnName })
      : makeForm({ columns, linkedTable }, [
          comboValidator([linkedTable, columns], (args) =>
            validateTableIsNotLinkedViaSelectedColumn(...args),
          ),
        ]);
  $: proceedButtonLabel =
    $targetType === 'existingTable'
      ? 'Move Columns'
      : 'Create Table and Move Columns';
  $: linkedTables = getLinkedTables({
    constraints,
    columns: $processedColumns,
    tables: $tablesDataStore.data,
  });
  $: action = $targetType === 'newTable' ? 'extract' : 'move';
  $: actionTitleCase = $targetType === 'newTable' ? 'Extract' : 'Move';
  $: s = $columns.length > 1 ? 's' : '';

  function suggestNewFkColumnName(
    newTableName: string,
    newAvailableColumns: { name: string }[],
  ) {
    $newFkColumnName = getSuggestedFkColumnName(
      { name: newTableName },
      newAvailableColumns,
    );
  }
  $: suggestNewFkColumnName($tableName, availableColumns);

  function handleColumnsChange(_columns: ProcessedColumn[]) {
    if (!$isOpen) {
      return;
    }
    if (_columns.length === 0) {
      // If the user clears the chosen columns, we don't want to update the
      // selected cells because it would mean that no columns are selected. When
      // no columns are selected, the column pane of the table inspector closes,
      // unmounting this component.
      return;
    }
    selection.intersectSelectedRowsWithGivenColumns(_columns);
  }
  $: handleColumnsChange($columns);

  async function handleSave() {
    /**
     * We need this copy so that the value remains non-reactive when passed to
     * the toast message because the toast continues to display after the
     * reactive $newFkColumnName value is reset.
     */
    const constFkColumnName = $newFkColumnName;
    const newTableName = $tableName;
    const followUps: Promise<unknown>[] = [];
    const extractedColumnIds = $columns.map((c) => c.id);
    try {
      if ($targetType === 'existingTable') {
        const targetTableId = $linkedTable?.table.id;
        if (!targetTableId) {
          throw new Error('No target table selected');
        }
        await moveColumns($tabularData.id, extractedColumnIds, targetTableId);
        const fkColumns = $linkedTable?.columns ?? [];
        let fkColumnId: number | undefined = undefined;
        if (fkColumns.length === 1) {
          fkColumnId = fkColumns[0].column.id;
        }
        followUps.push(
          $tabularData.refreshAfterColumnExtraction(
            extractedColumnIds,
            fkColumnId,
          ),
        );
      } else {
        const response = await splitTable({
          id: $tabularData.id,
          idsOfColumnsToExtract: extractedColumnIds,
          extractedTableName: newTableName,
          newFkColumnName: $newFkColumnName,
        });
        followUps.push(getTableFromStoreOrApi(response.extracted_table));
        followUps.push(
          $tabularData.refreshAfterColumnExtraction(
            extractedColumnIds,
            response.fk_column,
          ),
        );
      }
      if ($targetType === 'newTable') {
        toast.success({
          title: `A new table '${newTableName}' has been created with the extracted column(s)`,
          contentComponent: SuccessToastContent,
          contentComponentProps: {
            newFkColumnName: constFkColumnName,
          },
        });
      } else {
        toast.success({
          title: `The column(s) have been moved to '${$linkedTable?.table.name}'`,
        });
      }
      controller.close();
      await Promise.all(followUps);
      if ($targetType === 'newTable') {
        // We ase using `get(processedColumns)` instead of `$processedColumns`
        // because the store gets updated when the above promises settle, and
        // for some reason Svelte doesn't seem to dispatch that update to the
        // store when we're using the dollar syntax here. There may be a cleaner
        // approach.
        const allColumns = [...get(processedColumns).values()];
        // Here we assume that the new column will be positioned at the end. We
        // will need to modify this logic when we position the new column where
        // the old columns were.
        const newFkColumn = allColumns.slice(-1)[0];
        selection.toggleColumnSelection(newFkColumn);
        await tick();
        scrollBasedOnSelection();
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }
</script>

<ControlledModal {controller} on:close{form.reset}>
  <span slot="title">
    {#if $targetType === 'existingTable'}
      Move Columns To Linked Table
    {:else}
      Extract Columns Into a New Table
    {/if}
  </span>

  {#if $targetType === 'newTable'}
    <Field field={tableName} label="Name of New Table" layout="stacked">
      <span slot="help">
        The new table that will be linked to
        <CurrentTable table={$currentTable} />
      </span>
    </Field>
  {:else}
    <Field
      field={linkedTable}
      input={{ component: SelectLinkedTable, props: { linkedTables } }}
      label="Linked Table"
      layout="stacked"
    />
  {/if}

  <Field
    field={columns}
    input={{
      component: SelectProcessedColumns,
      props: { options: availableProcessedColumns },
    }}
    label={`Columns to ${actionTitleCase}`}
    layout="stacked"
  >
    <span slot="help">
      Select the columns you want to {action}
      {#if targetTableName}
        into
        <TargetTable name={targetTableName} />
      {/if}
    </span>
  </Field>

  <FieldLayout>
    <OutcomeBox>
      <p>
        The column{s} above will be removed from
        <CurrentTable table={$currentTable} />
        and added to
        <TargetTable name={targetTableName} />
      </p>
      {#if $targetType === 'newTable'}
        <p>
          A new column will be added to
          <CurrentTable table={$currentTable} />
        </p>
        <Field field={newFkColumnName} label="Column Name" />
      {/if}
    </OutcomeBox>
  </FieldLayout>

  <FormSubmit
    {form}
    slot="footer"
    proceedButton={{ label: proceedButtonLabel }}
    onProceed={handleSave}
    onCancel={() => controller.close()}
  />
</ControlledModal>
