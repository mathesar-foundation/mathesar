<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    FormSubmit,
    makeForm,
    optionalField,
  } from '@mathesar/components/form';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import type { TabularData } from '@mathesar/stores/table-data';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Spinner } from '@mathesar-component-library';

  import Preview from './Preview.svelte';
  import Template from './Template.svelte';

  export let tabularData: TabularData;

  $: ({ isLoading, table, processedColumns, database } = tabularData);
  $: template = optionalField(table?.metadata?.record_summary_template ?? null);
  $: form = makeForm({ template });

  async function save() {
    try {
      // await updateTable({
      //   schema: table.schema,
      //   table: {
      //     oid: table.oid,
      //     metadata: {
      //       record_summary_template: $template,
      //     },
      //   },
      // });
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
  {#if $isLoading}
    <Spinner />
  {:else}
    <Preview {tabularData} context="table" template={$template} />

    <Template template={$template} columns={$processedColumns} {database} />

    <FormSubmit
      {form}
      onProceed={save}
      onCancel={form.reset}
      proceedButton={{ label: $_('save') }}
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
