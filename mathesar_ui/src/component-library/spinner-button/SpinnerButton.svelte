<script lang="ts">
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import Spinner from '@mathesar-component-library-dir/spinner/Spinner.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { Size } from '@mathesar-component-library-dir/commonTypes';

  export let label = 'Proceed';

  // TODO: Removing this default proceed icon
  // Change if needed in other designs
  export let icon: IconProps | undefined = undefined;
  export let onClick: () => Promise<void> | void = () => {};
  export let disabled = false;
  export let isProcessing = false;
  export let size: Size | undefined = undefined;

  /**
   * Bind to this function if you want to be able to programmatically call the
   * proceed function from within the parent component and show the loading
   * spinner while the promise is resolving.
   */
  export async function proceed(): Promise<void> {
    isProcessing = true;
    try {
      await onClick();
    } finally {
      isProcessing = false;
    }
  }
</script>

<Button
  on:click={proceed}
  appearance="primary"
  disabled={disabled || isProcessing}
  {size}
>
  {#if isProcessing}
    <Spinner />
  {:else if icon}
    <Icon {...icon} />
  {/if}
  <span>{label}</span>
</Button>
