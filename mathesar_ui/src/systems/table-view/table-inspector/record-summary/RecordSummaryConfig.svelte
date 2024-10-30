<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { ResultValue } from '@mathesar/api/rpc/records';
  import {
    FormSubmit,
    makeForm,
    optionalField,
  } from '@mathesar/components/form';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import { iconUndo } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Table } from '@mathesar/models/Table';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';
  import { updateTable } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Spinner, defined } from '@mathesar-component-library';

  import Preview from './Preview.svelte';
  import Template from './Template.svelte';
  import { TemplateConfig } from './TemplateConfig';

  export let database: Pick<Database, 'id'>;
  export let table: Table;
  export let processedColumns: ProcessedColumns;
  export let isLoading = false;
  export let previewRecordId: ResultValue | undefined;

  $: template = table?.metadata?.record_summary_template ?? undefined;
  $: templateConfig = optionalField(
    defined(template, (t) => TemplateConfig.fromTemplate(t)),
  );
  $: form = makeForm({ templateConfig });

  async function save() {
    try {
      await updateTable({
        schema: table.schema,
        table: {
          oid: table.oid,
          metadata: {
            record_summary_template: $templateConfig?.template ?? null,
          },
        },
      });
    } catch (e) {
      toast.error(`${$_('unable_to_save_changes')} ${getErrorMessage(e)}`);
    }
  }
</script>

<div class="record-summary-config">
  <InfoBox>
    <p>
      Mathesar helps you identify records in a table by generating a short piece
      of text to summarize each record. These record summaries display in
      various places throughout the app, such as foreign key cells and record
      page titles.
    </p>
    <p>
      Use the form below to customize the fields included in the record summary.
    </p>
  </InfoBox>
  {#if isLoading}
    <Spinner />
  {:else}
    <Template
      bind:templateConfig={$templateConfig}
      columns={processedColumns}
      {database}
    />

    {#if previewRecordId !== undefined}
      <Preview
        {database}
        {table}
        recordId={previewRecordId}
        template={$templateConfig?.template ?? null}
      />
    {/if}

    <FormSubmit
      {form}
      onProceed={save}
      onCancel={form.reset}
      proceedButton={{ label: $_('save') }}
      cancelButton={{ label: $_('reset'), icon: iconUndo }}
      initiallyHidden
      size="small"
    />
  {/if}
</div>

<style>
  .record-summary-config > :global(* + *) {
    margin-top: 1rem;
  }
</style>
