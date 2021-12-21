<script lang='ts'>
  import type { LayoutConditionalSwitchElement } from './types.d';

  export let store;
  export let cases: LayoutConditionalSwitchElement['cases'];
</script>

{#each (cases[$store] || cases.default || []) as element (element)}
  <slot {element}></slot>
{/each}
