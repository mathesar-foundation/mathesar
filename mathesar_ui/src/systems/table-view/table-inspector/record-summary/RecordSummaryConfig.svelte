<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    FormSubmit,
    makeForm,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Table } from '@mathesar/models/Table';
  import { currentDatabase } from '@mathesar/stores/databases';
  import type { RecordRow, TabularData } from '@mathesar/stores/table-data';
  import { updateTable } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { RadioGroup, Spinner } from '@mathesar-component-library';

  import {
    columnIsConformant,
    getColumnsInTemplate,
    hasColumnReferences,
  } from './recordSummaryTemplateUtils';
  import TemplateInput from './TemplateInput.svelte';

  export let table: Table;
  export let tabularData: TabularData;

  $: ({ recordsData, columnsDataStore, isLoading } = tabularData);
  $: ({ columns } = columnsDataStore);
  $: ({ savedRecords, linkedRecordSummaries: recordSummaries } = recordsData);
  $: firstRow = $savedRecords[0] as RecordRow | undefined;
  $: initialCustomized = table.metadata?.record_summary_customized ?? false;
  $: initialTemplate = table.metadata?.record_summary_template ?? '';
  $: customized = requiredField(initialCustomized);
  $: customizedDisabled = customized.disabled;
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

    // TODO: Fully re-implement record summary previews across the stack, now
    // with a new backend-centric approach since we're no longer rendering the
    // record summary on the front end.

    // return renderRecordSummaryForRow({
    //   template: $template,
    //   record,
    //   transitiveData: $recordSummaries,
    // });
    return '';
  })();

  async function save() {
    try {
      await updateTable({
        schema: table.schema,
        table: {
          oid: table.oid,
          metadata: {
            record_summary_customized: $customized,
            record_summary_template: $template,
          },
        },
      });
    } catch (e) {
      toast.error(`${$_('unable_to_save_changes')} ${getErrorMessage(e)}`);
    }
  }
</script>

<div class="record-summary-config">
  {#if $isLoading}
    <Spinner />
  {:else}
    {#if previewRecordSummary}
      <div class="heading">{$_('preview')}</div>
      <div class="content">
        <div class="help">
          <RichText text={$_('record_summary_help')} let:slotName>
            {#if slotName === 'tableName'}
              <Identifier>{table.name}</Identifier>
            {/if}
          </RichText>
        </div>
        <LinkedRecord recordSummary={previewRecordSummary} />
      </div>
    {/if}

    <div class="heading">{$_('template')}</div>
    <div class="content">
      <RadioGroup
        options={[false, true]}
        getRadioLabel={(v) => (v ? $_('custom') : $_('default'))}
        ariaLabel={$_('template_type')}
        isInline
        bind:value={$customized}
        disabled={$customizedDisabled}
      />

      {#if $customized}
        <Field
          field={template}
          input={{ component: TemplateInput, props: { columns: $columns } }}
        />

        {#if nonconformantColumns.length}
          <InfoBox>
            <div class="nonconformant-columns">
              <p>
                {$_('record_summary_non_conformant_columns_help')}:
              </p>
              <ul>
                {#each nonconformantColumns as column}
                  <li>
                    <RichText
                      text={$_('column_id_references_column_name')}
                      let:slotName
                    >
                      {#if slotName === 'columnId'}
                        <Identifier>{column.id}</Identifier>
                      {:else if slotName === 'columnName'}
                        <Identifier>{column.name}</Identifier>
                      {/if}
                    </RichText>
                  </li>
                {/each}
              </ul>
            </div>
          </InfoBox>
        {/if}
      {/if}

      <FormSubmit
        {form}
        onProceed={save}
        onCancel={form.reset}
        proceedButton={{ label: $_('save') }}
        initiallyHidden
        size="small"
      />
    </div>

    <span class="null-text">{$_('no_record_summary_available')}</span>
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
  .null-text {
    color: var(--color-text-muted);
  }
</style>
