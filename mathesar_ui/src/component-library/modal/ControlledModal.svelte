<script lang="ts">
  import IndependentModal from './IndependentModal.svelte';
  import type ModalController from './ModalController';
  import type { ModalCloseAction, ModalWidth } from './modalTypes';

  type Options = $$Generic;

  export let controller: ModalController<Options>;
  export let title: string | undefined = undefined;
  export let size: ModalWidth | undefined = undefined;
  export let allowClose = true;
  export let closeOn: ModalCloseAction[] = ['button'];
  export let canScrollBody = true;

  $: ({ isOpen, isOnTop, options: optionsStore } = controller);

  // We are narrowing `Options | undefined` to `Options` because we want it to
  // be defined when passed to the slots. This makes consuming code more
  // ergonomic.
  //
  // This is safe because we know that:
  //
  // - `IndependentModal` only renders its slots if the modal has been opened.
  // - `ModalController` sets `options` passed through its `.open()` method.
  // - Modals without options shouldn't be consuming the `options` slot props.
  //
  // Properly delegating type safety to TS is tricky here because some modals
  // have options and some don't. A more robust solution might be to have
  // separate types for modals with and without options. Hopefully this will
  // suffice for now.
  $: options = $optionsStore as Options;
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
  <slot {options} />
  <slot name="title" slot="title" {options} />
  <slot name="footer" slot="footer" {options} />
</IndependentModal>
