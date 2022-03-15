<script lang="ts">
  import Label from '@mathesar-component-library-dir/label/Label.svelte';
  import type { LabelController } from '@mathesar-component-library-dir/label/LabelController';

  export let labelController: LabelController | undefined = undefined;
</script>

{#if labelController}
  <Label controller={labelController} on:click --display="contents">
    <slot />
  </Label>
{:else}
  <slot />
{/if}
