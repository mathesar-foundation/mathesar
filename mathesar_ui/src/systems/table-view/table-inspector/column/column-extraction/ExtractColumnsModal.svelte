<script lang="ts">
  import { ControlledModal } from '@mathesar-component-library';
  import SelectProcessedColumns from '@mathesar/components/SelectProcessedColumns.svelte';
  import {
    getTabularDataStoreFromContext,
    type ProcessedColumn,
  } from '@mathesar/stores/table-data';
  import {
    requiredField,
    makeForm,
    Field,
    FormSubmit,
    comboValidator,
  } from '@mathesar/components/form';
  import {
    getTableFromStoreOrApi,
    moveColumns,
    splitTable,
    tables as tablesDataStore,
    validateNewTableName,
  } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import type { LinkedTable } from './columnExtractionTypes';
  import {
    getLinkedTables,
    validateTableIsNotLinkedViaSelectedColumn,
  } from './columnExtractionUtils';
  import type { ExtractColumnsModalController } from './ExtractColumnsModalController';
  import SelectLinkedTable from './SelectLinkedTable.svelte';

  const tabularData = getTabularDataStoreFromContext();

  export let controller: ExtractColumnsModalController;

  $: ({ processedColumns, constraintsDataStore, selection } = $tabularData);
  $: ({ constraints } = $constraintsDataStore);
  $: availableColumns = [...$processedColumns.values()];
  $: ({ targetType, columns, isOpen } = controller);
  $: linkedTable = requiredField<LinkedTable | undefined>(undefined);
  $: tableName = requiredField('', [$validateNewTableName]);
  $: newFkColumnName = requiredField(''); // TODO: add unique validation
  $: form =
    $targetType === 'newTable'
      ? makeForm({ columns, tableName }) // TODO: add newFkColumnName
      : makeForm({ columns, linkedTable }, [
          comboValidator([linkedTable, columns], (args) =>
            validateTableIsNotLinkedViaSelectedColumn(...args),
          ),
        ]);
  $: proceedButtonLabel =
    $targetType === 'existingTable' ? 'Move Columns' : 'Create Table';
  $: linkedTables = getLinkedTables({
    constraints,
    columns: $processedColumns,
    tables: $tablesDataStore.data,
  });

  function handleTableNameUpdate(_tableName: string) {
    $newFkColumnName = _tableName;
  }
  $: handleTableNameUpdate($tableName);

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
    const followUps: Promise<unknown>[] = [];
    try {
      if ($targetType === 'existingTable') {
        const targetTableId = $linkedTable?.table.id;
        if (!targetTableId) {
          throw new Error('No target table selected');
        }
        await moveColumns(
          $tabularData.id,
          $columns.map((c) => c.id),
          targetTableId,
        );
      } else {
        const response = await splitTable(
          $tabularData.id,
          $columns.map((c) => c.id),
          $tableName,
        );
        followUps.push(getTableFromStoreOrApi(response.extracted_table));
      }
      followUps.push($tabularData.refresh());
      await Promise.all(followUps);
      controller.close();
    } catch (e) {
      toast.error(getErrorMessage(e));
    }
  }
</script>

<ControlledModal {controller} on:close{form.reset}>
  <span slot="title">
    {#if $targetType === 'existingTable'}
      Move Columns to Linked Table
    {:else}
      New Linked Table From Columns
    {/if}
  </span>

  {#if $targetType === 'newTable'}
    <Field field={tableName} label="Name of New Table" layout="stacked" />
    <!--
        TODO Uncomment and implement when
        https://github.com/centerofci/mathesar/issues/1434 is done
      -->
    <!-- <Field
        field={newFkColumnName}
        label="Name of New Linking Column In This Table"
        layout="stacked"
      /> -->
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
    input={{ component: SelectProcessedColumns, props: { availableColumns } }}
    label="Columns to Move"
    layout="stacked"
  >
    <span slot="help">
      These columns will be removed from the current table and moved to the
      linked table.
    </span>
  </Field>

  <FormSubmit
    {form}
    slot="footer"
    proceedButton={{ label: proceedButtonLabel }}
    onProceed={handleSave}
    onCancel={() => controller.close()}
  />
</ControlledModal>
