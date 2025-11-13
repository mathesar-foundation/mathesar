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
  import FormStatus from '@mathesar/components/form/FormStatus.svelte';
  import { iconSave, iconUndo } from '@mathesar/icons';
  import type RecordStore from '@mathesar/systems/record-view/RecordStore';

  import DirectField from '../record-view/DirectField.svelte';
  import RecordTitle from '../record-view/RecordTitle.svelte';
  import Widgets from '../record-view/Widgets.svelte';

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
    const processedColumn = $processedColumns.get(columnId);
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
  <div use:portalToWindowTitle class="title-bar">
    <div class="record-title">
      <RecordTitle {record} />
    </div>
    <FormStatus {form} />
  </div>

  <div class="fields">
    {#each fieldPropsObjects as { field, processedColumn } (processedColumn.id)}
      <DirectField {record} {processedColumn} {field} {canUpdateTableRecords} />
    {/each}
  </div>

  {#if $form.hasChanges}
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
  {/if}

  {#await getJoinableTablesResult(table.oid) then joinableTablesResult}
    <Widgets
      {joinableTablesResult}
      {recordPk}
      recordSummary={$summary}
      isInModal
    />
  {/await}
</div>

<style lang="scss">
  .title-bar {
    align-items: center;
    justify-content: space-between;
    gap: var(--sm3);
    > .record-title {
      overflow: hidden;
    }

    display: grid;
    grid-template: auto / 1fr auto;
  }
  .fields {
    display: grid;
    grid-template-columns: auto 1fr;
  }
  .submit {
    margin-top: 2rem;
  }
</style>
