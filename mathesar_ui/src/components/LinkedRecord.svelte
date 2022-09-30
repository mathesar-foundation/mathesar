<script lang="ts">
  import {
    renderTransitiveRecordSummary,
    type DataForRecordSummaryInFkCell,
  } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';

  export let recordId: unknown;
  export let dataForRecordSummaryInFkCell:
    | DataForRecordSummaryInFkCell
    | undefined;

  $: recordSummary = dataForRecordSummaryInFkCell
    ? renderTransitiveRecordSummary(dataForRecordSummaryInFkCell)
    : String(recordId);
</script>

<span class="linked-record">
  {recordSummary}
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
