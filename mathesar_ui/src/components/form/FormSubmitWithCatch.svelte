<script lang="ts">
  import type { ComponentProps } from 'svelte';

  import FormSubmit from './FormSubmit.svelte';
  import type { Form } from './form';
  import { getErrorMessage } from '@mathesar/utils/errors';

  interface $$Props extends ComponentProps<FormSubmit> {
    getErrorMessages?: (e: unknown) => string[];
  }

  export let form: Form;
  export let onProceed: () => Promise<void> | void = () => {};
  export let getErrorMessages: (e: unknown) => string[] = (e) => [
    getErrorMessage(e),
  ];

  async function proceed() {
    try {
      form.requestStatus.set({ state: 'processing' });
      await onProceed();
      form.requestStatus.set({ state: 'success' });
    } catch (e) {
      const errors = getErrorMessages(e);
      form.requestStatus.set({ state: 'failure', errors });
    }
  }
</script>

<FormSubmit
  {form}
  onProceed={proceed}
  onCancel={() => form.reset()}
  {...$$restProps}
/>
