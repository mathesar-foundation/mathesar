<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import { FormSubmit } from '@mathesar/components/form';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { toast } from '@mathesar/stores/toast';

  import type { DataFormManager } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: DataFormManager;

  $: ({ submitButtonLabel, formHolder, token } =
    dataFormManager.dataFormStructure);
  $: label = $submitButtonLabel?.trim() || $_('submit');
  $: form = $formHolder;

  async function submit() {
    // TODO_FORMS: Implement showing submission status info & redirection
    try {
      await api.forms
        .submit({
          form_token: token,
          values: dataFormManager.dataFormStructure.getFormSubmitRequest(),
        })
        .run();
      toast.success($_('form_submitted_successfully'));
    } catch (err) {
      toast.error(RpcError.fromAnything(err));
    }
  }
</script>

<div class="submit-buttons">
  <FormSubmit
    {form}
    catchErrors
    onProceed={submit}
    proceedButton={{
      label,
      icon: undefined,
    }}
    cancelButton={{ label: $_('clear_form') }}
  />
</div>

<style lang="scss">
  .submit-buttons {
    padding: var(--lg1);
  }
</style>
