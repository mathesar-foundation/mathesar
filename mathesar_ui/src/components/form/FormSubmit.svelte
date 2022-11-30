<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { CancelOrProceedButtonPair } from '@mathesar-component-library';
  import type { Form } from './form';

  interface $$Props extends ComponentProps<CancelOrProceedButtonPair> {
    form: Form;
    initiallyHidden?: boolean;
  }

  export let form: Form;
  export let initiallyHidden = false;
  export let onCancel = () => form.reset();

  $: ({ hasChanges, canSubmit } = $form);
</script>

{#if !initiallyHidden || hasChanges}
  <CancelOrProceedButtonPair
    canProceed={canSubmit}
    {onCancel}
    {...$$restProps}
  />
{/if}
