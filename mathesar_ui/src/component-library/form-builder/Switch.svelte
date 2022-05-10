<script lang="ts">
  import { computeSwitchElements } from './utils';
  import type { FormValueStore, ConditionalSwitchElement } from './types';

  export let store: FormValueStore;
  export let cases: ConditionalSwitchElement['cases'];

  $: elementsToDisplay = computeSwitchElements($store, { cases });
</script>

{#each elementsToDisplay as element (element)}
  <slot {element} />
{/each}
