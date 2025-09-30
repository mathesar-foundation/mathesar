<script lang="ts">
  import clickOffBounds from '@mathesar-component-library-dir/common/actions/clickOffBounds';
  import popper, {
    getVirtualReferenceElement,
  } from '@mathesar-component-library-dir/common/actions/popper';
  import portal from '@mathesar-component-library-dir/common/actions/portal';
  import { PreparedMenu } from '@mathesar-component-library-dir/prepared-menu';

  import type { ContextMenuController } from './ContextMenuController';

  export let controller: ContextMenuController;

  $: props = $controller;
</script>

{#if props}
  <div
    class="context-menu dropdown content"
    use:clickOffBounds={{ callback: () => controller.close() }}
    use:popper={{ reference: getVirtualReferenceElement(props.position) }}
    use:portal
    on:click={() => controller.close()}
  >
    <PreparedMenu
      entries={props.entries}
      modal={{ close: () => controller.close() }}
    />
  </div>
{/if}
