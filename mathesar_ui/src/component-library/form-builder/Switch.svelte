<script lang="ts">
  import { computeSwitchElements } from './utils';
  import type { FormInputStore, ConditionalSwitchElement } from './types';

  export let store: FormInputStore;
  export let cases: ConditionalSwitchElement['cases'];

  $: elementsToDisplay = computeSwitchElements($store, { cases });
</script>

{#each elementsToDisplay as element (element)}
  <slot {element} />
{/each}
