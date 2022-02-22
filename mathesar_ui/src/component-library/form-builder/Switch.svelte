<script lang="ts">
  import type { FormInputStore, ConditionalSwitchElement } from './types.d';

  export let store: FormInputStore;
  export let cases: ConditionalSwitchElement['cases'];

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  $: elements = cases[$store?.toString()] || cases.default || [];
</script>

{#each elements as element (element)}
  <slot {element} />
{/each}
