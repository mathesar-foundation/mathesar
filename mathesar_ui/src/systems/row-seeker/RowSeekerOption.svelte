<script lang="ts">
  import type { RecordSummaryListResult } from '@mathesar/api/rpc/records';
  import {
    MatchHighlighter,
    Radio,
    Truncate,
  } from '@mathesar-component-library';

  import type RowSeekerController from './RowSeekerController';

  export let controller: RowSeekerController;
  export let showSelection = false;
  export let isSelected: boolean;
  export let inFocus: boolean;
  export let result: RecordSummaryListResult;

  $: ({ searchValue } = controller);
</script>

<div
  class="record"
  class:in-focus={inFocus}
  class:show-selection={showSelection}
>
  {#if showSelection}
    <div class="selection">
      <Radio checked={isSelected} />
    </div>
  {/if}
  <Truncate>
    <MatchHighlighter text={result.summary} substring={$searchValue} />
  </Truncate>
</div>

<style lang="scss">
  .record {
    border-bottom: 1px solid var(--border-color);
    padding: var(--sm4) var(--sm3);

    &.show-selection {
      display: grid;
      grid-template: auto / auto 1fr;
      gap: var(--sm4);
      .selection > :global(input) {
        cursor: default;
      }
    }
  }
</style>
