<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getDetailedRecordsErrors } from '@mathesar/api/rest/utils/recordUtils';
  import { api } from '@mathesar/api/rpc';
  import {
    FormSubmit,
    makeForm,
    optionalField,
  } from '@mathesar/components/form';
  import FormStatus from '@mathesar/components/form/FormStatus.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconRecord, iconSave, iconUndo } from '@mathesar/icons';
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import type { Table } from '@mathesar/models/Table';
  import type { TableStructure } from '@mathesar/stores/table-data';
  import { currentTable } from '@mathesar/stores/tables';

  import DirectField from './DirectField.svelte';
  import RecordPageLoadingSpinner from './RecordPageLoadingSpinner.svelte';
  import type RecordStore from './RecordStore';
  import Widgets from './Widgets.svelte';

  export let record: RecordStore;
  export let tableStructure: TableStructure;

  $: table = $currentTable as Table;
  $: ({ currentRolePrivileges } = table.currentAccess);
  $: canUpdateTableRecords = $currentRolePrivileges.has('UPDATE');
  $: ({ processedColumns } = tableStructure);
  $: ({ recordPk, summary, fieldValues } = record);
  $: fieldPropsObjects = [...$processedColumns.values()].map((c) => ({
    processedColumn: c,
    field: optionalField($fieldValues.get(c.id)),
  }));
  $: formFields = Object.fromEntries(
    fieldPropsObjects.map((o) => [o.processedColumn.id, o.field]),
  );
  $: form = makeForm(formFields);

  function getJoinableTablesResult(tableId: number) {
    return api.tables
      .list_joinable({
        database_id: table.schema.database.id,
        table_oid: tableId,
        max_depth: 1,
      })
      .run();
  }

  function shouldPatchIncludeColumn(columnId: string) {
    const processedColumn = $processedColumns.get(parseInt(columnId, 10));
    if (!processedColumn) return false;

    // Only patch columns that are not primary keys.
    //
    // See https://github.com/mathesar-foundation/mathesar/issues/4318
    //
    // It would probably be better to check if the column is editable but we
    // don't have that information here. It would be good to include that in the
    // columns API response at some point.
    return !processedColumn.column.primary_key;
  }

  async function save() {
    const formValues = Object.entries($form.values);
    const patch = Object.fromEntries(
      formValues.filter(([c]) => shouldPatchIncludeColumn(c)),
    );
    await record.patch(patch);
  }
</script>

<div class="record-page-content">
  <InsetPageLayout>
    <div slot="header" class="header">
      <h1 class="title">
        <NameWithIcon icon={iconRecord}>{$summary}</NameWithIcon>
      </h1>
      <div class="table-name">
        <RichText text={$_('record_in_table')} let:slotName>
          {#if slotName === 'tableName'}
            <TableName {table} truncate={false} />
          {/if}
        </RichText>
      </div>
      <div class="form-status"><FormStatus {form} /></div>
    </div>
    <div class="fields">
      {#each fieldPropsObjects as { field, processedColumn } (processedColumn.id)}
        <DirectField
          {record}
          {processedColumn}
          {field}
          {canUpdateTableRecords}
        />
      {/each}
    </div>
    <div class="submit">
      <FormSubmit
        {form}
        catchErrors
        proceedButton={{ label: $_('save'), icon: iconSave }}
        cancelButton={{ label: $_('discard_changes'), icon: iconUndo }}
        onProceed={save}
        getErrorMessages={(e) => {
          const { columnErrors, recordErrors } = getDetailedRecordsErrors(e);
          for (const [columnId, errors] of columnErrors) {
            formFields[columnId]?.serverErrors.set(errors);
          }
          return recordErrors;
        }}
        initiallyHidden
      />
    </div>
  </InsetPageLayout>

  {#await getJoinableTablesResult(table.oid)}
    <RecordPageLoadingSpinner />
  {:then joinableTablesResult}
    <Widgets {joinableTablesResult} {recordPk} recordSummary={$summary} />
  {/await}
</div>

<style>
  .record-page-content {
    height: 100%;
    display: grid;
    grid-template: auto 1fr / auto;
    overflow-y: auto;
  }
  .header {
    display: grid;
    grid-template: auto auto / auto 1fr;
    gap: 0.5rem 1.5rem;
    align-items: center;
    margin-bottom: 1.5rem;
    overflow: hidden;
  }
  .title {
    grid-row: 1;
    grid-column: 1;
    margin: 0;
    overflow: hidden;
    color: var(--text-color-primary);
  }
  .table-name {
    grid-row: 2;
    grid-column: 1;
    color: var(--text-color-secondary);
  }
  .form-status {
    grid-row: 1 / span 2;
    grid-column: 2;
  }

  .fields {
    display: grid;
    grid-template-columns: auto 1fr;
  }
  .submit {
    --form-submit-margin: 2rem 0 0 0;
  }
</style>
