<script lang="ts">
  import IndependentModal from './IndependentModal.svelte';
  import type ModalController from './ModalController';
  import type { ModalCloseAction, ModalWidth } from './modalTypes';

  export let controller: ModalController;
  export let title: string | undefined = undefined;
  export let size: ModalWidth | undefined = undefined;
  export let allowClose = true;
  export let closeOn: ModalCloseAction[] = ['button'];
  export let canScrollBody = true;

  $: ({ isOpen, isOnTop } = controller);
</script>

<IndependentModal
  bind:isOpen={$isOpen}
  hasOverlay={$isOnTop}
  {title}
  {size}
  allowClose={allowClose && $isOnTop}
  {closeOn}
  on:open
  on:close
  {canScrollBody}
  modalId={controller.modalId}
>
  <slot />
  <slot name="title" slot="title" />
  <slot name="footer" slot="footer" />
</IndependentModal>
