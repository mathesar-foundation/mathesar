<script lang="ts">
  import { Alert, RadioGroup } from '@mathesar-component-library';
  import {
    FormSubmit,
    makeForm,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import {
    getTabularDataStoreFromContext,
    type RecordRow,
  } from '@mathesar/stores/table-data';
  import { renderRecordSummaryForRow } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';
  import {
    currentTable as table,
    saveRecordSummaryTemplate,
  } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import {
    columnIsConformant,
    getColumnsInTemplate,
    hasColumnReferences,
  } from './recordSummaryTemplateUtils';
  import TemplateInput from './TemplateInput.svelte';

  const tabularData = getTabularDataStoreFromContext();

  $: ({ recordsData, columnsDataStore } = $tabularData);
  $: ({ columns } = columnsDataStore);
  $: ({ savedRecords } = recordsData);
  $: firstRow = $savedRecords[0] as RecordRow | undefined;
  $: initialCustomized = $table?.settings.preview_settings.customized ?? false;
  $: initialTemplate = $table?.settings.preview_settings.template ?? '';
  $: customized = requiredField(initialCustomized);
  $: template = optionalField(initialTemplate, [hasColumnReferences($columns)]);
  $: form = makeForm({ customized, template });
  $: columnsInTemplate = getColumnsInTemplate($columns, $template);
  $: nonconformantColumns = columnsInTemplate.filter(
    (column) => !columnIsConformant(column),
  );
  $: previewRecordSummary = (() => {
    if (!$table || !firstRow) {
      return undefined;
    }
    const { record } = firstRow;
    return renderRecordSummaryForRow({ template: $template, record });
  })();

  async function save() {
    try {
      if (!$table) {
        throw new Error('Unable to find table.');
      }
      await saveRecordSummaryTemplate($table, $form.values);
    } catch (e) {
      toast.error(`Unable to save. ${getErrorMessage(e)}`);
    }
  }
</script>

{#if previewRecordSummary}
  <div>Preview</div>
  <LinkedRecord recordSummary={previewRecordSummary} />
{/if}

<div>Template</div>
<RadioGroup
  options={[false, true]}
  getRadioLabel={(v) => (v ? 'Custom' : 'Default')}
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
        Because some column names contain curly braces, the following numerical
        values are used in place of column names within the above template:
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

<style>
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
