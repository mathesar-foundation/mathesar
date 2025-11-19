<script lang="ts">
  import {
    Checkbox,
    MatchHighlighter,
    Truncate,
    LabeledInput,
  } from '@mathesar-component-library';

  import type MultiTaggerController from './MultiTaggerController';

  export let controller: MultiTaggerController;
  export let isSelected: boolean;
  export let summary: string;

  $: ({ searchValue } = controller);
</script>

<div class="record">
  <LabeledInput layout="inline-input-first">
    <span slot="label">
      <Truncate>
        <MatchHighlighter text={summary} substring={$searchValue} />
      </Truncate>
    </span>
    <Checkbox tabindex="-1" checked={isSelected} />
  </LabeledInput>
</div>

<style>
  .record {
    border-bottom: 1px solid var(--border-color);
    padding: var(--sm5) var(--sm3);
  }
</style>
