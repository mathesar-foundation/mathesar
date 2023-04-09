<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';
  import Button from '@mathesar-component-library-dir/button/Button.svelte';
  import Spinner from '@mathesar-component-library-dir/spinner/Spinner.svelte';
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { Appearance } from '../commonTypes';

  /** TODO: Improve typing to ensure there's either a label or an icon */
  interface $$Props extends ComponentProps<Button> {
    label?: string;
    icon?: IconProps;
    onClick?: () => Promise<void> | void;
    confirm?: () => Promise<boolean>;
    disabled?: boolean;
    isProcessing?: boolean;
  }

  export let label = 'Proceed';
  export let icon: IconProps | undefined = undefined;
  export let onClick: () => Promise<void> | void = () => {};
  /**
   * The `confirm` callback will run before the spinner starts spinning. If it
   * resolves to `true`, then the onClick callback will run. If it resolves to
   * `false`, then the spinner will not start spinning and the onClick callback
   * will not run.
   */
  export let confirm: () => Promise<boolean> = async () => true;
  export let disabled = false;
  export let isProcessing = false;
  export let appearance: Appearance = 'primary';

  /**
   * Bind to this function if you want to be able to programmatically call the
   * proceed function from within the parent component and show the loading
   * spinner while the promise is resolving.
   */
  export async function proceed(): Promise<void> {
    const isConfirmed = await confirm();
    if (!isConfirmed) {
      return;
    }
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
  {appearance}
  disabled={disabled || isProcessing}
  {...$$restProps}
>
  {#if isProcessing}
    <Spinner />
  {:else if icon}
    <Icon {...icon} />
  {/if}
  {#if label}
    <span>{label}</span>
  {/if}
</Button>
