<script lang="ts">
  import {
    Checkbox,
    MatchHighlighter,
    Truncate,
    LabeledInput,
  } from '@mathesar-component-library';
  import type { ResultValue } from '@mathesar/api/rpc/records';

  export let searchValue: string | undefined = undefined;
  export let joinTable: number | undefined = undefined;
  export let joinValue: ResultValue | undefined = undefined;
  export let summary: string;

  $: checked = joinValue !== undefined;

  function handleChange(e: CustomEvent<boolean>) {
    throw new Error('Not implemented');
  }
</script>

<div class="record">
  <LabeledInput layout="inline-input-first">
    <span slot="label">
      <Truncate>
        <MatchHighlighter text={summary} substring={searchValue} />
      </Truncate>
    </span>
    <Checkbox {checked} on:change={handleChange} />
  </LabeledInput>
</div>

<style>
  .record {
    border-bottom: 1px solid var(--border-color);
    padding: var(--sm5) var(--sm3);
  }
</style>
