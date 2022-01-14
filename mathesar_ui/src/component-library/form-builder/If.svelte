<script lang="ts">
  import { checkCondition } from './utils';
  import type { FormInputStore, ConditionalIfElement } from './types.d';

  export let store: FormInputStore;
  export let condition: ConditionalIfElement['condition'] = 'eq';
  export let value: ConditionalIfElement['value'];
  export let elements: ConditionalIfElement['elements'];

  $: isConditionSatisfied = checkCondition($store, condition, value);
</script>

{#if isConditionSatisfied}
  {#each elements || [] as element (element)}
    <slot {element} />
  {/each}
{/if}
