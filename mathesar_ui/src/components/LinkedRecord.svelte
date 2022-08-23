<script lang="ts">
  import type { FkSummaryRecord } from '@mathesar/api/tables/records';

  export let recordId: unknown;
  export let fkSummaryValue: FkSummaryRecord | undefined;
  export let label: string | undefined = undefined;
  // Replace the column template with respective foreign key record value
  $: recordSummary = fkSummaryValue
    ? Object.entries(fkSummaryValue.data).reduce(
        (template, [columnAlias, value]) =>
          template.replace(`{${columnAlias}}`, String(value)),
        fkSummaryValue.template,
      )
    : String(recordId);
</script>

<span class="linked-record">
  {#if label !== undefined}
    {label}
  {:else}
    {recordSummary}
  {/if}
</span>

<style>
  .linked-record {
    background: var(--color-fk);
    padding: 0.1rem 0.4rem;
    border-radius: 0.25rem;
    display: block;
    max-width: max-content;
    overflow: hidden;
    white-space: nowrap;
    text-overflow: ellipsis;
  }
</style>
