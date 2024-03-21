<script lang="ts">
  import { tick } from 'svelte';
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';
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
  import TableName from '@mathesar/components/TableName.svelte';
  import {
    getTabularDataStoreFromContext,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import {
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
  import { RichText } from '@mathesar/components/rich-text';
  import type { LinkedTable } from './columnExtractionTypes';
  import {
    getLinkedTables,
    validateTableIsNotLinkedViaSelectedColumn,
  } from './columnExtractionUtils';
  import type { ExtractColumnsModalController } from './ExtractColumnsModalController';
  import SelectLinkedTable from './SelectLinkedTable.svelte';
  import SuccessToastContent from './SuccessToastContent.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let controller: ExtractColumnsModalController;

  $: ({
    processedColumns,
    constraintsDataStore,
    selection,
    table: currentTable,
  } = $tabularData);
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
      ? $_('move_columns')
      : $_('create_table_move_columns');
  $: linkedTables = getLinkedTables({
    constraints,
    columns: $processedColumns,
    tables: $tablesDataStore.data,
  });
  $: selectedColumnsHelpText = (() => {
    if ($targetType === 'existingTable') {
      if (targetTableName) {
        return $_('select_columns_move_into_table');
      }
      return $_('select_columns_move');
    }
    if (targetTableName) {
      return $_('select_columns_extract_into_table');
    }
    return $_('select_columns_extract');
  })();

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
    const columnIds = _columns.map((c) => String(c.id));
    selection.update((s) => s.ofRowColumnIntersection(s.rowIds, columnIds));
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
    const extractedColumns = $columns;
    const extractedColumnIds = extractedColumns.map((c) => c.id);
    try {
      if ($targetType === 'existingTable') {
        const targetTableId = $linkedTable?.table.id;
        if (!targetTableId) {
          throw new Error($_('no_target_table_selected'));
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
          title: $_('new_table_created_with_extracted_column', {
            values: { count: extractedColumns.length, newTableName },
          }),
          contentComponent: SuccessToastContent,
          contentComponentProps: {
            newFkColumnName: constFkColumnName,
          },
        });
      } else {
        const columnNames = extractedColumns.map(
          (processedColumn) => processedColumn.column.name,
        );
        const linkedTableName = $linkedTable?.table.name ?? '';
        let message: string;
        if (columnNames.length === 1) {
          message = $_('column_moved_to_table', {
            values: {
              columnName: columnNames[0],
              tableName: linkedTableName,
            },
          });
        } else {
          message = $_('columns_moved_to_table', {
            values: {
              columnNames: columnNames.join(','),
              tableName: linkedTableName,
            },
          });
        }
        toast.success(message);
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
        selection.update((s) => s.ofOneColumn(String(newFkColumn.id)));
        await tick();
        scrollBasedOnSelection();
      }
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }
</script>

<ControlledModal {controller} on:close={form.reset}>
  <span slot="title">
    {#if $targetType === 'existingTable'}
      {$_('move_columns_to_linked_table', {
        values: { count: $columns.length },
      })}
    {:else}
      {$_('extract_columns_to_new_table', {
        values: { count: $columns.length },
      })}
    {/if}
  </span>

  {#if $targetType === 'newTable'}
    <Field field={tableName} label={$_('name_of_new_table')} layout="stacked">
      <span slot="help">
        <RichText
          text={$_('new_table_that_will_be_linked_to_table')}
          let:slotName
        >
          {#if slotName === 'tableName'}
            <TableName table={currentTable} truncate={false} bold />
          {/if}
        </RichText>
      </span>
    </Field>
  {:else}
    <Field
      field={linkedTable}
      input={{ component: SelectLinkedTable, props: { linkedTables } }}
      label={$_('linked_table')}
      layout="stacked"
    />
  {/if}

  <Field
    field={columns}
    input={{
      component: SelectProcessedColumns,
      props: { options: availableProcessedColumns },
    }}
    label={$targetType === 'newTable'
      ? $_('columns_to_extract')
      : $_('columns_to_move')}
    layout="stacked"
  >
    <span slot="help">
      <RichText text={selectedColumnsHelpText} let:slotName>
        {#if slotName === 'targetTableName'}
          <TableName table={{ name: targetTableName }} truncate={false} bold />
        {/if}
      </RichText>
    </span>
  </Field>

  <FieldLayout>
    <OutcomeBox>
      <p>
        <RichText
          text={targetTableName
            ? $_('columns_removed_from_table_added_to_target', {
                values: { count: $columns.length },
              })
            : $_('columns_removed_from_table_added_to_new_table', {
                values: { count: $columns.length },
              })}
          let:slotName
        >
          {#if slotName === 'tableName'}
            <TableName table={currentTable} truncate={false} bold />
          {:else if slotName === 'targetTableName' && targetTableName}
            <TableName
              table={{ name: targetTableName }}
              truncate={false}
              bold
            />
          {/if}
        </RichText>
      </p>
      {#if $targetType === 'newTable'}
        <p>
          <RichText text={$_('new_column_added_to_table')} let:slotName>
            {#if slotName === 'tableName'}
              <TableName table={currentTable} truncate={false} bold />
            {/if}
          </RichText>
        </p>
        <Field field={newFkColumnName} label={$_('column_name')} />
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
