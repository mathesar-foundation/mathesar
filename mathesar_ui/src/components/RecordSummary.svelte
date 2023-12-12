<script lang="ts">
  import { displayRecordSummaryAsHtml } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';

  export let recordSummary: string;
</script>

<!-- eslint-disable-next-line svelte/no-at-html-tags -->
{@html displayRecordSummaryAsHtml(recordSummary)}
