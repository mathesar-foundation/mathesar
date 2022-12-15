<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import { getErrorMessage } from '@mathesar/utils/errors';
  import Errors from './Errors.svelte';
  import type { Form } from './form';
  import FormSubmit from './FormSubmit.svelte';

  interface $$Props extends ComponentProps<FormSubmit> {
    getErrorMessages?: (e: unknown) => string[];
  }

  export let form: Form;
  export let onProceed: () => Promise<void> | void = () => {};
  export let getErrorMessages: (e: unknown) => string[] = (e) => [
    getErrorMessage(e),
  ];

  $: ({ requestStatus } = form);
  $: errors = $requestStatus?.state === 'failure' ? $requestStatus.errors : [];

  async function proceed() {
    try {
      form.clearServerErrors();
      form.requestStatus.set({ state: 'processing' });
      await onProceed();
      form.requestStatus.set({ state: 'success' });
    } catch (e) {
      form.requestStatus.set({ state: 'failure', errors: getErrorMessages(e) });
    }
  }
</script>

<div class="form-submit-with-catch">
  <FormSubmit
    {form}
    onProceed={proceed}
    onCancel={() => form.reset()}
    {...$$restProps}
  />
  <div class="errors">
    <Errors {errors} />
  </div>
</div>

<style>
  .errors {
    --MessageBox__margin: 1rem 0 0 1rem;
  }
</style>
