<script lang='ts'>
  import type { IconDefinition } from '@fortawesome/fontawesome-common-types';
  import { faArrowRight } from '@fortawesome/free-solid-svg-icons';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import Spinner from '@mathesar-component-library-dir/spinner/Spinner.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconFlip, IconRotate } from '@mathesar-component-library-dir/types';

  interface IconDetails {
    data: IconDefinition,
    spin?: boolean,
    flip?: IconFlip,
    rotate?: IconRotate,
  }
  
  export let label = 'Proceed';
  export let icon: IconDetails = { data: faArrowRight };
  export let onClick: () => Promise<void>;
  export let disabled = false;
  export let isProcessing = false;

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
  appearance=primary
  disabled={disabled || isProcessing}
>
  {#if isProcessing}
    <Spinner />
  {:else}
    <Icon {...icon} />
  {/if}
  <span>{label}</span>
</Button>
