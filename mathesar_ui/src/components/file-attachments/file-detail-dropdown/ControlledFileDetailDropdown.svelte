<script lang="ts">
  import FileDetailDropdown from './FileDetailDropdown.svelte';
  import type { FileDetailDropdownController } from './FileDetailDropdownController';

  export let controller: FileDetailDropdownController;

  $: props = $controller;
</script>

{#if props}
  <FileDetailDropdown close={() => controller.close()} {...props} />
{/if}
