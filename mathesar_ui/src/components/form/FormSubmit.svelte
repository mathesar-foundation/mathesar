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

  $: ({ isDirty, isValid } = $form);
</script>

{#if !initiallyHidden || isDirty}
  <CancelOrProceedButtonPair canProceed={isValid} {onCancel} {...$$restProps} />
{/if}
