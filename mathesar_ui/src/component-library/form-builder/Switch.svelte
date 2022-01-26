<script lang="ts">
  import type { FormInputStore, ConditionalSwitchElement } from './types.d';

  export let store: FormInputStore;
  export let cases: ConditionalSwitchElement['cases'];
</script>

{#each cases[$store?.toString()] || cases.default || [] as element (element)}
  <slot {element} />
{/each}
