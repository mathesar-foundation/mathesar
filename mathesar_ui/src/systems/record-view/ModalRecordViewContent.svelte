<!--
@component

TODO: Resolve code duplication between this file and RecordPageContent.svelte.
-->
<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getDetailedRecordsErrors } from '@mathesar/api/rest/utils/recordUtils';
  import { api } from '@mathesar/api/rpc';
  import { portalToWindowTitle } from '@mathesar/component-library';
  import {
    FormSubmit,
    makeForm,
    optionalField,
  } from '@mathesar/components/form';
  import { iconSave, iconUndo } from '@mathesar/icons';
  import type RecordStore from '@mathesar/stores/RecordStore';

  import DirectField from './DirectField.svelte';
  import RecordTitle from './RecordTitle.svelte';
  import Widgets from './Widgets.svelte';

  export let record: RecordStore;

  $: ({ table, tableStructure } = record);
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

<div class="modal-record-view-content">
  <div use:portalToWindowTitle>
    <RecordTitle {record} />
  </div>

  <div class="fields">
    {#each fieldPropsObjects as { field, processedColumn } (processedColumn.id)}
      <DirectField {record} {processedColumn} {field} {canUpdateTableRecords} />
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

  {#await getJoinableTablesResult(table.oid) then joinableTablesResult}
    <Widgets {joinableTablesResult} {recordPk} recordSummary={$summary} />
  {/await}
</div>

<style lang="scss">
  .fields {
    display: grid;
    grid-template-columns: auto 1fr;
  }
  .submit {
    --form-submit-margin: 2rem 0 0 0;
  }
</style>
