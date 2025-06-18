<script lang="ts">
  import { onMount } from 'svelte';

  import { AttachableDropdown } from '@mathesar-component-library';

  import type AttachableRowSeekerController from './AttachableRowSeekerController';
  import RowSeeker from './RowSeeker.svelte';

  export let selectedRecord:
    | {
        summary: string;
        pk: string | number | boolean | null;
      }
    | undefined = undefined;

  export let controller: AttachableRowSeekerController;
  $: ({ isOpen, node, rowSeeker } = controller);

  $: portalTarget = (() => {
    // We need to be able to scroll the sheet freely while dropdown is open.
    //  - If it's appended to body, we'll need to proxy scroll the scrollable parent of the trigger
    //  - Easiest way is to not append to body, and append to the trigger's parent instead
    // We need the dropdown to display on top of all other elements.
    //  - This requires us to append it to body
    // We aren't doing the above here. This is a placeholder to handle the case later

    // const parent = node?.closest<HTMLElement>('[data-sheet-element="data-row"]') ?? document.body;
    const parent = document.body;
    return parent;
  })();

  onMount(() => {
    //
  });
</script>

<AttachableDropdown
  trigger={node}
  isOpen={$isOpen}
  {portalTarget}
  on:close={() => controller.close()}
>
  <RowSeeker
    controller={rowSeeker}
    {selectedRecord}
    on:escape={() => controller.close()}
  />
</AttachableDropdown>

<style lang="scss">
</style>
