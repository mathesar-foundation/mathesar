<script lang='ts'>
  import { checkCondition } from './utils';
  import type { LayoutConditionalIfElement } from './types.d';

  export let store;
  export let condition: LayoutConditionalIfElement['condition'] = 'eq';
  export let value: unknown;
  export let elements: LayoutConditionalIfElement['elements'];

  $: isConditionSatisfied = checkCondition($store, condition, value);
</script>

{#if isConditionSatisfied}
  {#each (elements || []) as element (element)}
    <slot {element}></slot>
  {/each}
{/if}
