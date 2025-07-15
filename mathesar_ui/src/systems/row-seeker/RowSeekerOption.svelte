<script lang="ts">
  import type { RecordSummaryListResult } from '@mathesar/api/rpc/records';
  import { MatchHighlighter } from '@mathesar-component-library';

  import type RowSeekerController from './RowSeekerController';

  export let controller: RowSeekerController;
  export let isSelected: boolean;
  export let inFocus: boolean;
  export let result: RecordSummaryListResult;

  $: ({ searchValue } = controller);
</script>

<div class="record" class:selected={isSelected} class:in-focus={inFocus}>
  <MatchHighlighter text={result.summary} substring={$searchValue} />
</div>

<style>
  .record {
    border-bottom: 1px solid var(--border-color);
    padding: var(--sm4) var(--sm3);
  }
  .record.selected {
    background-color: var(--active-background);
  }
</style>
