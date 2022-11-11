<script lang="ts">
  import { PrecomputedMatchHighlighter } from '@mathesar-component-library';
  import type { MatchPart } from '@mathesar-component-library/types';
  import type { CellValueFormatter } from './cell-fabric/utils';
  import Default from './Default.svelte';
  import Null from './Null.svelte';

  type Value = $$Generic;

  export let value: Value | null | undefined;
  export let formatValue: CellValueFormatter<Value> = (v) => String(v);
  export let matchParts: MatchPart[] | undefined = undefined;

  $: formattedValue = formatValue(value);
</script>

{#if value === null}
  <Null />
{:else if value === undefined}
  <Default />
{:else if matchParts}
  <PrecomputedMatchHighlighter {matchParts} />
{:else}
  <slot {formattedValue}>
    {formattedValue}
  </slot>
{/if}
