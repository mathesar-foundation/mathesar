<script lang="ts">
  import type { IconPathDefinition } from './IconTypes';

  export let path: IconPathDefinition;
  export let style: string | undefined = undefined;
</script>

{#if typeof path === 'string'}
  <path d={path} {style} />
{:else}
  <path
    d={path.path}
    fill-rule={path.fillRule}
    clip-rule={path.clipRule}
    {style}
  />
{/if}
