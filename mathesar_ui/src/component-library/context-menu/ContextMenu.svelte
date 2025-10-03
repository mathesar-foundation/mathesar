<script lang="ts">
  import popper, {
    getVirtualReferenceElement,
  } from '@mathesar-component-library-dir/common/actions/popper';
  import portal from '@mathesar-component-library-dir/common/actions/portal';
  import { PreparedMenu } from '@mathesar-component-library-dir/prepared-menu';

  import type { ContextMenuController } from './ContextMenuController';

  export let controller: ContextMenuController;

  $: props = $controller;

  function handleClickBackdrop() {
    controller.close();
  }
</script>

{#if props}
  <div class="context-menu-backdrop" on:click={handleClickBackdrop} />
  <div
    class="context-menu dropdown content"
    use:popper={{ reference: getVirtualReferenceElement(props.position) }}
    use:portal
    on:click={() => controller.close()}
  >
    <PreparedMenu
      entries={props.entries}
      modal={{
        close: () => {
          controller.close();
        },
        closeRoot: () => {
          controller.close();
        },
      }}
    />
  </div>
{/if}

<style>
  .context-menu-backdrop {
    position: fixed;
    inset: 0;
    z-index: var(--dropdown-z-index);
  }
</style>
