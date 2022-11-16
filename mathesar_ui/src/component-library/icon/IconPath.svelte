<script lang="ts">
  import type { IconPathDefinition } from './IconTypes';

  export let path: IconPathDefinition;
</script>

{#if typeof path === 'string'}
  <path d={path} />
{:else}
  <path d={path.path} fill-rule={path.fillRule} clip-rule={path.clipRule} />
{/if}
