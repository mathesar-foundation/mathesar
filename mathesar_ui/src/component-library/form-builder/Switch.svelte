<script lang="ts">
  import type { ConditionalSwitchElement, FormValueStore } from './types';
  import { computeSwitchElements } from './utils';

  export let store: FormValueStore;
  export let cases: ConditionalSwitchElement['cases'];

  $: elementsToDisplay = computeSwitchElements($store, { cases });
</script>

{#each elementsToDisplay as element (element)}
  <slot {element} />
{/each}
