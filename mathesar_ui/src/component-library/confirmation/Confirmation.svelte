<script lang="ts">
  import Button from '../button/Button.svelte';
  import Icon from '../icon/Icon.svelte';
  import Modal from '../modal/Modal.svelte';
  import Spinner from '../spinner/Spinner.svelte';
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
  $: bodyParagraphs = Array.isArray(body) ? body : [body];

  let isProcessing = false;

  function handleCancelButton() {
    $resolve(false);
    modal.close();
  }

  async function handleProceedButton() {
    try {
      isProcessing = true;
      await onProceed();
      onSuccess();
      $resolve(true);
      modal.close();
    } catch (error) {
      onError(error);
    } finally {
      isProcessing = false;
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
    // There are many places in the code where we could potentially reset the
    // spinnner. We do it here because it's the lowest level which ensures there
    // is no way to close the modal without resetting the spinner.
    isProcessing = false;
  }
</script>

<Modal
  bind:isOpen={$modal}
  {title}
  allowClose={!isProcessing}
  on:close={onClose}
  class="confirmation"
>
  {#each bodyParagraphs as paragraph}
     <p>{paragraph}</p>
  {/each}
  <div slot=footer class=buttons>
    <Button
      on:click={handleCancelButton}
      disabled={isProcessing}
    >
      {#if cancelButton.icon}<Icon {...cancelButton.icon} />{/if}
      <span>{cancelButton.label}</span>
    </Button>
    <Button
      on:click={handleProceedButton}
      appearance=primary
      disabled={isProcessing}
    >
      {#if isProcessing}
        <Spinner />
      {:else if proceedButton.icon}
        <Icon {...proceedButton.icon} />
      {/if}
      <span>{proceedButton.label}</span>
    </Button>
  </div>
</Modal>

<style global lang="scss">
  @import './Confirmation.scss';
</style>
