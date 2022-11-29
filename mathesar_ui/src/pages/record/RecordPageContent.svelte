<script lang="ts">
  import type { TableEntry } from '@mathesar/api/types/tables';
  import type { JoinableTablesResult } from '@mathesar/api/types/tables/joinable_tables';
  import { Spinner } from '@mathesar/component-library';
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
  import { getAPI } from '@mathesar/api/utils/requestUtils';
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

<InsetPageLayout>
  <div slot="header">
    <h1><NameWithIcon icon={iconRecord}>{$summary}</NameWithIcon></h1>
    <div>Record in <TableName {table} /></div>
    <FormStatus {form} />
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
      initiallyHidden
    />
  </div>
</InsetPageLayout>

<div class="widgets">
  {#await getJoinableTablesResult(table.id)}
    <Spinner />
  {:then joinableTablesResult}
    <Widgets {joinableTablesResult} {recordId} />
  {/await}
</div>

<style>
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
