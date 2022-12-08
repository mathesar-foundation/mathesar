<script lang="ts">
  import { Alert, RadioGroup } from '@mathesar-component-library';
  import type { TableEntry } from '@mathesar/api/types/tables';
  import Spinner from '@mathesar/component-library/spinner/Spinner.svelte';
  import {
    FormSubmit,
    makeForm,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import type { RecordRow, TabularData } from '@mathesar/stores/table-data';
  import { renderRecordSummaryForRow } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import { saveRecordSummaryTemplate } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import {
    columnIsConformant,
    getColumnsInTemplate,
    hasColumnReferences,
  } from './recordSummaryTemplateUtils';
  import TemplateInput from './TemplateInput.svelte';

  export let table: TableEntry;
  export let tabularData: TabularData;

  $: ({ recordsData, columnsDataStore, isLoading } = tabularData);
  $: ({ columns } = columnsDataStore);
  $: ({ savedRecords, recordSummaries } = recordsData);
  $: firstRow = $savedRecords[0] as RecordRow | undefined;
  $: initialCustomized = table.settings.preview_settings.customized ?? false;
  $: initialTemplate = table.settings.preview_settings.template ?? '';
  $: customized = requiredField(initialCustomized);
  $: template = optionalField(initialTemplate, [hasColumnReferences($columns)]);
  $: form = makeForm({ customized, template });
  $: columnsInTemplate = getColumnsInTemplate($columns, $template);
  $: nonconformantColumns = columnsInTemplate.filter(
    (column) => !columnIsConformant(column),
  );
  $: previewRecordSummary = (() => {
    if (!firstRow) {
      return undefined;
    }
    const { record } = firstRow;
    return renderRecordSummaryForRow({
      template: $template,
      record,
      transitiveData: $recordSummaries,
    });
  })();

  async function save() {
    try {
      await saveRecordSummaryTemplate(table, $form.values);
    } catch (e) {
      toast.error(`Unable to save. ${getErrorMessage(e)}`);
    }
  }
</script>

<div class="record-summary-config">
  {#if $isLoading}
    <Spinner />
  {:else}
    {#if previewRecordSummary}
      <div class="heading">Preview</div>
      <div class="content">
        <div class="help">
          Shows how links to
          <Identifier>{table.name}</Identifier>
          records will appear.
        </div>
        <LinkedRecord recordSummary={previewRecordSummary} />
      </div>
    {/if}

    <div class="heading">Template</div>
    <div class="content">
      <RadioGroup
        options={[false, true]}
        getRadioLabel={(v) => (v ? 'Custom' : 'Default')}
        ariaLabel="Template type"
        isInline
        bind:value={$customized}
      />

      {#if $customized}
        <Field
          field={template}
          input={{ component: TemplateInput, props: { columns: $columns } }}
        />
      {/if}

      {#if nonconformantColumns.length}
        <Alert>
          <div class="nonconformant-columns">
            <p>
              Because some column names contain curly braces, the following
              numerical values are used in place of column names within the
              above template:
            </p>
            <ul>
              {#each nonconformantColumns as column}
                <li>
                  <Identifier>{column.id}</Identifier>
                  references the column <Identifier>{column.name}</Identifier>.
                </li>
              {/each}
            </ul>
          </div>
        </Alert>
      {/if}

      <FormSubmit
        {form}
        onProceed={save}
        onCancel={form.reset}
        proceedButton={{ label: 'Save' }}
        initiallyHidden
        size="small"
      />
    </div>
  {/if}
</div>

<style>
  .heading {
    margin-block: 0.75rem 0.5rem;
  }
  .content > :global(* + *) {
    margin-top: 0.5rem;
  }
  .content {
    margin-left: 0.5rem;
  }
  .help {
    font-size: var(--text-size-small);
    color: var(--color-text-muted);
  }
  .nonconformant-columns > :global(:first-child) {
    margin-top: 0;
  }
  .nonconformant-columns > :global(:last-child) {
    margin-bottom: 0;
  }
  .nonconformant-columns ul {
    padding-left: 1.5rem;
  }
</style>
