<!--
@component

TODO: Resolve code duplication between this file and RecordViewContent.svelte.
-->
<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { getDetailedRecordsErrors } from '@mathesar/api/rest/utils/recordUtils';
  import { api } from '@mathesar/api/rpc';
  import AppSecondaryHeader from '@mathesar/components/AppSecondaryHeader.svelte';
  import {
    FormSubmit,
    makeForm,
    optionalField,
  } from '@mathesar/components/form';
  import FormStatus from '@mathesar/components/form/FormStatus.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import TableName from '@mathesar/components/TableName.svelte';
  import { iconRecord, iconSave, iconUndo } from '@mathesar/icons';
  import InsetPageLayout from '@mathesar/layouts/InsetPageLayout.svelte';
  import DirectField from '@mathesar/systems/record-view/DirectField.svelte';
  import type RecordStore from '@mathesar/systems/record-view/RecordStore';
  import RecordViewLoadingSpinner from '@mathesar/systems/record-view/RecordViewLoadingSpinner.svelte';
  import Widgets from '@mathesar/systems/record-view/Widgets.svelte';

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

<div class="record-page-content">
  <AppSecondaryHeader
    name={$summary}
    icon={iconRecord}
    entityTypeName={$_('record')}
    --header-color="linear-gradient(
      135deg,
      var(--color-surface-base), 15%,
      var(--color-record-10) 40%,
      var(--color-surface-base) 60%,
      var(--color-record-20) 100%
    )"
    --entity-name-color="var(--color-record)"
    --bottom-margin="var(--sm1)"
    --page-padding-x="6rem"
  >
    <div slot="subText" class="table-name">
      <RichText text={$_('record_in_table')} let:slotName>
        {#if slotName === 'tableName'}
          <TableName {table} truncate={false} />
        {/if}
      </RichText>
    </div>
    <div slot="action">
      <div class="form-status"><FormStatus {form} /></div>
    </div>
  </AppSecondaryHeader>
  <InsetPageLayout --inset-page-padding="0rem 0rem 2rem 0rem">
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
    <RecordViewLoadingSpinner />
  {:then joinableTablesResult}
    <div class="widgets-container">
      <Widgets {joinableTablesResult} {recordPk} recordSummary={$summary} />
    </div>
  {/await}
</div>

<style>
  .record-page-content {
    height: 100%;
    display: grid;
    grid-template: auto 1fr / auto;
    overflow-y: auto;
  }
  .table-name {
    grid-row: 2;
    grid-column: 1;
    color: var(--text-secondary);
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
  .widgets-container {
    margin: 0 var(--sm1) var(--lg1) var(--sm1);
  }
</style>
