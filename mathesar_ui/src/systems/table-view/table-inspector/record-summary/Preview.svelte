<script lang="ts">
  import { api } from '@mathesar/api/rpc';
  import type { RecordSummaryTemplate } from '@mathesar/api/rpc/tables';
  import Spinner from '@mathesar/component-library/spinner/Spinner.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import type { TabularData } from '@mathesar/stores/table-data';
  import {
    Fieldset,
    assertExhaustive,
    defined,
  } from '@mathesar-component-library';

  import {
    type RecordSummaryTemplateEditingContext,
    getTableRecordId,
  } from './utils';

  const preview = new AsyncRpcApiStore(api.records.get);

  export let context: RecordSummaryTemplateEditingContext;
  export let tabularData: TabularData;
  export let template: RecordSummaryTemplate | null;

  $: ({ table, recordsData, selection, processedColumns } = tabularData);
  $: ({ selectableRowsMap } = recordsData);
  $: recordId = (() => {
    if (context === 'table') {
      return getTableRecordId({
        processedColumns: $processedColumns,
        selection: $selection,
        selectableRowsMap: $selectableRowsMap,
      });
    }
    if (context === 'fk-column') {
      throw new Error('Not yet implemented');
    }
    return assertExhaustive(context);
  })();

  $: if (recordId) {
    void preview.run({
      database_id: tabularData.database.id,
      table_oid: tabularData.table.oid,
      return_record_summaries: true,
      record_id: recordId,
      table_record_summary_templates: template
        ? { [tabularData.table.oid]: template }
        : null,
    });
  }

  $: recordSummary =
    $preview.resolvedValue?.record_summaries?.[String(recordId)];
</script>

{#if recordId}
  <Fieldset label="Preview" boxed>
    {#if $preview.isLoading}
      <Spinner />
    {:else if recordSummary}
      <LinkedRecord {recordSummary} />
    {:else if $preview.error}
      <ErrorBox>{$preview.error}</ErrorBox>
    {:else}
      <ErrorBox>An unknown error occurred.</ErrorBox>
    {/if}

    <div class="help">
      <RichText
        text={'This is how the currently selected [tableName] record will be summarized.'}
        let:slotName
      >
        {#if slotName === 'tableName'}
          <Identifier>{table.name}</Identifier>
        {/if}
      </RichText>
    </div>
  </Fieldset>
{/if}

<style>
  .help {
    font-size: var(--text-size-small);
    color: var(--color-text-muted);
    margin-top: 0.5rem;
  }
</style>
