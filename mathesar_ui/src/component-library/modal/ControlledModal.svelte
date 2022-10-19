<script lang="ts">
  import type { ModalCloseAction, ModalWidth } from './modalTypes';
  import IndependentModal from './IndependentModal.svelte';
  import type ModalController from './ModalController';

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
>
  <slot />
  <slot name="title" slot="title" />
  <slot name="footer" slot="footer" />
</IndependentModal>
