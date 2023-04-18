<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { getErrorMessage } from '@mathesar/utils/errors';
  import { CancelOrProceedButtonPair } from '@mathesar-component-library';
  import Errors from './Errors.svelte';
  import type { Form } from './form';

  interface $$Props extends ComponentProps<CancelOrProceedButtonPair> {
    form: Form;
    initiallyHidden?: boolean;
    getErrorMessages?: (e: unknown) => string[];
    catchErrors?: boolean;
  }

  export let form: Form;
  export let canProceed = true;
  export let initiallyHidden = false;
  export let onProceed: () => Promise<void> | void = () => {};
  export let onCancel = () => form.reset();
  export let getErrorMessages: (e: unknown) => string[] = (e) => [
    getErrorMessage(e),
  ];
  export let catchErrors = false;

  $: ({ requestStatus } = form);
  $: ({ hasChanges, canSubmit } = $form);
  $: errors = $requestStatus?.state === 'failure' ? $requestStatus.errors : [];

  async function proceed() {
    form.clearServerErrors();
    form.requestStatus.set({ state: 'processing' });

    if (!catchErrors) {
      await onProceed();
      form.requestStatus.set(undefined);
      return;
    }

    try {
      await onProceed();
      form.requestStatus.set({ state: 'success' });
    } catch (e) {
      form.requestStatus.set({ state: 'failure', errors: getErrorMessages(e) });
    }
  }
</script>

<div class="form-submit">
  {#if !initiallyHidden || hasChanges}
    <CancelOrProceedButtonPair
      onProceed={proceed}
      canProceed={canProceed && canSubmit}
      {onCancel}
      {...$$restProps}
    />
  {/if}
  {#if catchErrors}
    <div class="errors">
      <Errors {errors} />
    </div>
  {/if}
</div>

<style>
  .form-submit {
    margin: var(--form-submit-margin);
  }
  .errors {
    --MessageBox__margin: 1rem 0 0 1rem;
  }
</style>
