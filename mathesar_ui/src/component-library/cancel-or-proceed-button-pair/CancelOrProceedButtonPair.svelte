<script lang="ts">
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import SpinnerButton from '@mathesar-component-library-dir/spinner-button/SpinnerButton.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import {
    iconCancel,
    iconProceed,
  } from '@mathesar-component-library-dir/common/icons';
  import type { Size } from '@mathesar-component-library-dir/commonTypes';
  import type { ButtonDetails } from './CancelOrProceedButtonPairTypes';

  const cancelButtonDefaults: ButtonDetails = {
    label: 'Cancel',
    icon: iconCancel,
  };

  const proceedButtonDefaults: ButtonDetails = {
    label: 'Proceed',
    icon: iconProceed,
  };

  export let cancelButton: Partial<ButtonDetails> = {};
  export let proceedButton: Partial<ButtonDetails> = {};
  export let onCancel: () => void;
  export let onProceed: () => Promise<void>;
  export let canProceed = true;
  export let canCancel = true;
  export let isProcessing = false;
  export let size: Size | undefined = undefined;

  let spinnerButtonProceed: () => Promise<void> = async () => {};

  export function proceed(): Promise<void> {
    // Why do we have `spinnerButtonProceed` and `proceed` separately?
    //
    // Because we want to export a const (`proceed` here) to make it clear to
    // consuming components that they can't supply their own function. AND we
    // need for _this_ component to be able to change the function in the
    // process of binding to the value from lower down in the component tree.
    return spinnerButtonProceed();
  }

  $: fullCancelButton = { ...cancelButtonDefaults, ...cancelButton };
  $: fullProceedButton = { ...proceedButtonDefaults, ...proceedButton };
</script>

<div class="cancel-or-proceed-button-pair">
  <Button
    appearance="secondary"
    on:click={onCancel}
    disabled={isProcessing || !canCancel}
    {size}
  >
    {#if fullCancelButton.icon}<Icon {...fullCancelButton.icon} />{/if}
    <span>{fullCancelButton.label}</span>
  </Button>
  <SpinnerButton
    bind:isProcessing
    bind:proceed={spinnerButtonProceed}
    onClick={onProceed}
    icon={fullProceedButton.icon}
    label={fullProceedButton.label}
    disabled={isProcessing || !canProceed}
    {size}
  />
</div>
