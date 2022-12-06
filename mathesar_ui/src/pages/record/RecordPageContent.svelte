<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { JoinableTablesResult } from '@mathesar/api/types/tables/joinable_tables';
  import { getDetailedRecordsErrors } from '@mathesar/api/utils/recordUtils';
  import { getAPI } from '@mathesar/api/utils/requestUtils';
  import { Spinner } from '@mathesar-component-library';
  import {
    FormSubmitWithCatch,
    makeForm,
    optionalField,
  } from '@mathesar/components/form';
  import FormStatus from '@mathesar/components/form/FormStatus.svelte';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconRecord, iconSave, iconUndo } from '@mathesar/icons';
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import type { TableStructure } from '@mathesar/stores/table-data';
  import { currentTable } from '@mathesar/stores/tables';
  import DirectField from './DirectField.svelte';
  import type RecordStore from './RecordStore';
  import Widgets from './Widgets.svelte';

  export let record: RecordStore;
  export let tableStructure: TableStructure;

  $: table = $currentTable as TableEntry;
  $: ({ processedColumns } = tableStructure);
  $: ({ recordId, summary, fieldValues } = record);
  $: fieldPropsObjects = [...$processedColumns.values()].map((c) => ({
    processedColumn: c,
    field: optionalField($fieldValues.get(c.id)),
  }));
  $: formFields = Object.fromEntries(
    fieldPropsObjects.map((o) => [o.processedColumn.id, o.field]),
  );
  $: form = makeForm(formFields);

  function getJoinableTablesResult(tableId: number) {
    return getAPI<JoinableTablesResult>(
      `/api/db/v0/tables/${tableId}/joinable_tables/?max_depth=1`,
    );
  }
</script>

<div class="record-page-content">
  <InsetPageLayout>
    <div slot="header" class="header">
      <h1 class="title">
        <NameWithIcon icon={iconRecord}>{$summary}</NameWithIcon>
      </h1>
      <div class="table-name">Record in <TableName {table} /></div>
      <div class="form-status"><FormStatus {form} /></div>
    </div>
    <div class="fields">
      {#each fieldPropsObjects as { field, processedColumn } (processedColumn.id)}
        <DirectField {record} {processedColumn} {field} />
      {/each}
    </div>
    <div class="submit">
      <FormSubmitWithCatch
        {form}
        proceedButton={{ label: 'Save', icon: iconSave }}
        cancelButton={{ label: 'Discard Changes', icon: iconUndo }}
        onProceed={() => record.patch($form.values)}
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

  {#await getJoinableTablesResult(table.id)}
    <Spinner />
  {:then joinableTablesResult}
    <Widgets {joinableTablesResult} {recordId} recordSummary={$summary} />
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
    gap: 0.25rem 1.5rem;
    align-items: center;
    margin-bottom: 1.5rem;
  }
  .title {
    grid-row: 1;
    grid-column: 1;
    margin: 0;
  }
  .table-name {
    grid-row: 2;
    grid-column: 1;
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
    margin-top: 2rem;
  }
  .submit:empty {
    display: none;
  }
</style>
