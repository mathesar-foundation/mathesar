<script lang="ts">
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import SpinnerButton from '@mathesar-component-library-dir/spinner-button/SpinnerButton.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import { faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';
  import type { ButtonDetails } from './CancelOrProceedButtonPair';

  const cancelButtonDefaults: ButtonDetails = {
    label: 'Cancel',
    icon: { data: faArrowLeft },
  };

  const proceedButtonDefaults: ButtonDetails = {
    label: 'Proceed',
    icon: { data: faCheck },
  };

  export let cancelButton: Partial<ButtonDetails> = {};
  export let proceedButton: Partial<ButtonDetails> = {};
  export let onCancel: () => void;
  export let onProceed: () => Promise<void>;
  export let canProceed = true;
  export let canCancel = true;
  export let isProcessing = false;
  /**
   * Bind to this function if you want to be able to programmatically call the
   * proceed function from within the parent component and show the loading
   * spinner while the promise is resolving.
   */
  export let proceed: () => Promise<void> = async () => {};

  $: fullCancelButton = { ...cancelButtonDefaults, ...cancelButton };
  $: fullProceedButton = { ...proceedButtonDefaults, ...proceedButton };
</script>

<div class="cancel-or-proceed-button-pair">
  <Button on:click={onCancel} disabled={isProcessing || !canCancel}>
    {#if fullCancelButton.icon}<Icon {...fullCancelButton.icon} />{/if}
    <span>{fullCancelButton.label}</span>
  </Button>
  <SpinnerButton
    bind:isProcessing
    bind:proceed
    onClick={onProceed}
    icon={fullProceedButton.icon}
    label={fullProceedButton.label}
    disabled={isProcessing || !canProceed}
  />
</div>
