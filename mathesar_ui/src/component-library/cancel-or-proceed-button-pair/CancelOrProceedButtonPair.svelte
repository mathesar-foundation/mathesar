<script lang='ts'>
  import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import Spinner from '@mathesar-component-library-dir/spinner/Spinner.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconFlip, IconRotate } from '@mathesar-component-library-dir/types';
  import { faArrowLeft, faCheck } from '@fortawesome/free-solid-svg-icons';

  interface IconDetails {
    data: IconDefinition,
    spin?: boolean,
    flip?: IconFlip,
    rotate?: IconRotate,
  }

  interface ButtonDetails {
    label: string,
    icon: IconDetails,
  }

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

  $: fullCancelButton = { ...cancelButtonDefaults, ...cancelButton };
  $: fullProceedButton = { ...proceedButtonDefaults, ...proceedButton };

  let isProcessing = false;

  export async function proceed(): Promise<void> {
    isProcessing = true;
    try {
      await onProceed();
    } finally {
      isProcessing = false;
    }
  }
</script>

<div class=cancel-or-proceed-button-pair>
  <Button
    on:click={onCancel}
    disabled={!canCancel || isProcessing}
  >
    {#if fullCancelButton.icon}<Icon {...fullCancelButton.icon} />{/if}
    <span>{fullCancelButton.label}</span>
  </Button>
  <Button
    on:click={proceed}
    appearance=primary
    disabled={!canProceed || isProcessing}
  >
    {#if isProcessing}
      <Spinner />
    {:else if fullProceedButton.icon}
      <Icon {...fullProceedButton.icon} />
    {/if}
    <span>{fullProceedButton.label}</span>
  </Button>
</div>

<style global lang='scss'>
  @import './CancelOrProceedButtonPair.scss';
</style>
