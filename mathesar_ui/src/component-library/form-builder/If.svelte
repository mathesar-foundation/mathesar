<script lang="ts">
  import type { ConditionalIfElement, FormValueStore } from './types';
  import { computeIfElements } from './utils';

  export let store: FormValueStore;
  export let condition: ConditionalIfElement['condition'] = 'eq';
  export let value: ConditionalIfElement['value'];
  export let elements: ConditionalIfElement['elements'];

  $: elementsToDisplay = computeIfElements($store, {
    condition,
    value,
    elements,
  });
</script>

{#each elementsToDisplay as element (element)}
  <slot {element} />
{/each}
