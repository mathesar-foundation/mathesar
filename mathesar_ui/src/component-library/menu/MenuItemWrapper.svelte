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
  <button class="passthrough-button">
    <slot />
  </button>
{/if}

<style>
  .passthrough-button {
    text-align: inherit;
    display: contents;
    color: inherit;
    font-family: inherit;
    font-weight: inherit;
    font-size: inherit;
    cursor: inherit;
  }
</style>
