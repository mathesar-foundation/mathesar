<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { ResultValue } from '@mathesar/api/rpc/records';
  import {
    FormSubmit,
    makeForm,
    optionalField,
    validIf,
  } from '@mathesar/components/form';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import { iconUndo } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Table } from '@mathesar/models/Table';
  import type { ProcessedColumns } from '@mathesar/stores/table-data';
  import { updateTable } from '@mathesar/stores/tables';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Help, Spinner, defined } from '@mathesar-component-library';

  import Preview from './Preview.svelte';
  import Template from './Template.svelte';
  import { TemplateConfig } from './TemplateConfig';

  export let database: Pick<Database, 'id'>;
  export let table: Table;
  export let processedColumns: ProcessedColumns;
  export let isLoading = false;
  export let previewRecordId: ResultValue | undefined;
  export let onSave: (() => void) | undefined = undefined;

  $: template = table?.metadata?.record_summary_template ?? undefined;
  $: templateConfig = optionalField(
    defined(template, (t) => TemplateConfig.fromTemplate(t)),
    [
      validIf(
        (t) => !!t?.hasAnyColumnParts,
        $_('static_record_summary_template_error'),
      ),
    ],
  );
  $: form = makeForm({ templateConfig });
  $: templateErrors = templateConfig.fieldErrors;
  $: hasPk = [...processedColumns].some(([, c]) => c.column.primary_key);

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
      onSave?.();
    } catch (e) {
      toast.error(`${$_('unable_to_save_changes')} ${getErrorMessage(e)}`);
    }
  }
</script>

<div class="record-summary-config">
  {#if !hasPk}
    <ErrorBox>
      <RichText text={$_('record_summary_no_pk_error')} let:slotName>
        {#if slotName === 'tableName'}
          <Identifier>{table.name}</Identifier>
        {/if}
      </RichText>
    </ErrorBox>
  {:else}
    <div class="help">
      <InfoBox>
        <RichText text={$_('record_summary_config_help')} let:slotName>
          {#if slotName === 'tableName'}
            <Identifier>{table.name}</Identifier>
          {/if}
        </RichText>
        <Help>
          <p>{$_('record_summary_detail_help_1')}</p>
          <p>
            <RichText text={$_('record_summary_detail_help_2')} let:slotName>
              {#if slotName === 'tableName'}
                <Identifier>{table.name}</Identifier>
              {/if}
            </RichText>
          </p>
        </Help>
      </InfoBox>
    </div>

    {#if isLoading}
      <Spinner />
    {:else}
      <Template
        bind:templateConfig={$templateConfig}
        columns={processedColumns}
        {database}
        errorsDisplayed={$form.hasChanges ? $templateErrors : []}
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
  {/if}
</div>

<style>
  .help {
    font-size: var(--text-size-small);
  }
  .record-summary-config > :global(* + *) {
    margin-top: 1rem;
  }
</style>
