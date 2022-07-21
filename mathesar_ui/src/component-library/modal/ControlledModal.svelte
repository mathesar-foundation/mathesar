<script lang="ts">
  import type { ModalCloseAction, ModalWidth } from './modalTypes';
  import IndependentModal from './IndependentModal.svelte';
  import type ModalController from './ModalController';

  export let controller: ModalController;
  export let title: string | undefined = undefined;
  let classes = '';
  export { classes as class };
  export let style = '';
  export let size: ModalWidth | undefined = undefined;
  export let allowClose = true;
  export let closeOn: ModalCloseAction[] = ['button'];

  $: ({ isOpen, isOnTop } = controller);
</script>

<IndependentModal
  bind:isOpen={$isOpen}
  hasOverlay={$isOnTop}
  {title}
  class={classes}
  {style}
  {size}
  allowClose={allowClose && $isOnTop}
  {closeOn}
  on:open
  on:close
>
  <slot />
  <slot name="title" slot="title" />
  <slot name="footer" slot="footer" />
</IndependentModal>
