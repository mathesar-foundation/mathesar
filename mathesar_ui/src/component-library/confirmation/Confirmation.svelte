<script lang="ts">
  import CancelOrProceedButtonPair from '@mathesar-component-library-dir/cancel-or-proceed-button-pair/CancelOrProceedButtonPair.svelte';
  import { ControlledModal } from '@mathesar-component-library-dir/modal';
  import StringOrComponent from '../string-or-component/StringOrComponent.svelte';
  import type { ConfirmationController } from './ConfirmationController';

  export let controller: ConfirmationController;

  $: ({ modal, confirmationProps, resolve } = controller);
  $: ({
    title,
    body,
    proceedButton,
    cancelButton,
    onProceed,
    onSuccess,
    onError,
  } = $confirmationProps);

  let allowClose = true;

  function handleCancelButton() {
    $resolve(false);
    modal.close();
  }

  async function handleProceedButton() {
    try {
      allowClose = false;
      await onProceed();
      onSuccess();
      $resolve(true);
      modal.close();
    } catch (error) {
      // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
      onError(error);
    } finally {
      allowClose = true;
    }
  }

  function onClose() {
    // When the user closes the confirmation modal by clicking on the "X" button
    // we want to resolve the promise.
    //
    // In a "proceed" situation, we call `$resolve(true)` first and _then_ close
    // the modal afterwards. Here, we're calling `deny()` no matter what
    // happened, which means `deny()` we'll ultimately call `$resolve(true)`
    // and then `$resolve(false)` which may seem a bit strange. This is fine
    // because though because a Promise can only be resolved once.
    $resolve(false);
    allowClose = true;
  }
</script>

<ControlledModal controller={modal} {allowClose} on:close={onClose}>
  <svelte:fragment slot="title">
    {#if title}
      <StringOrComponent arg={title} />
    {/if}
  </svelte:fragment>
  <StringOrComponent arg={body} />
  <CancelOrProceedButtonPair
    slot="footer"
    {cancelButton}
    {proceedButton}
    onCancel={handleCancelButton}
    onProceed={handleProceedButton}
  />
</ControlledModal>
