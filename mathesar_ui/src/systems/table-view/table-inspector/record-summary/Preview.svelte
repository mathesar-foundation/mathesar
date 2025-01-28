<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type { ResultValue } from '@mathesar/api/rpc/records';
  import type { RecordSummaryTemplate } from '@mathesar/api/rpc/tables';
  import Spinner from '@mathesar/component-library/spinner/Spinner.svelte';
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import LinkedRecord from '@mathesar/components/LinkedRecord.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Database } from '@mathesar/models/Database';
  import type { Table } from '@mathesar/models/Table';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { Fieldset } from '@mathesar-component-library';

  const preview = new AsyncRpcApiStore(api.records.get);

  export let database: Pick<Database, 'id'>;
  export let template: RecordSummaryTemplate | null;
  export let table: Table;
  export let recordId: ResultValue;

  $: void preview.run({
    database_id: database.id,
    table_oid: table.oid,
    return_record_summaries: true,
    record_id: recordId,
    table_record_summary_templates: { [table.oid]: template },
  });

  $: recordSummary =
    $preview.resolvedValue?.record_summaries?.[String(recordId)];
</script>

<Fieldset label={$_('preview')} boxed>
  {#if $preview.isLoading}
    <Spinner />
  {:else if recordSummary !== undefined}
    <LinkedRecord {recordSummary} />
  {:else}
    <Errors errors={[$preview.error ?? $_('unknown_error')]} />
  {/if}

  <div class="help">
    <RichText text={$_('record_summary_preview_help')} let:slotName>
      {#if slotName === 'tableName'}
        <Identifier>{table.name}</Identifier>
      {/if}
    </RichText>
  </div>
</Fieldset>

<style>
  .help {
    font-size: var(--text-size-small);
    color: var(--color-text-muted);
    margin-top: 0.5rem;
  }
</style>
