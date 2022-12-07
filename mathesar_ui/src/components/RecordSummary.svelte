<script lang="ts">
  import { displayRecordSummaryAsHtml } from '@mathesar/stores/table-data/record-summaries/recordSummaryUtils';

  export let recordSummary: string;
</script>

{@html displayRecordSummaryAsHtml(recordSummary)}
