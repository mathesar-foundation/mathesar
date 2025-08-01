<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { FormSubmit } from '@mathesar/components/form';

  import type { DataFormManager } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: DataFormManager;

  $: ({ submitButtonLabel, formHolder } = dataFormManager.dataFormStructure);
  $: label = $submitButtonLabel?.trim() || $_('submit');
  $: form = $formHolder;

  async function submit() {
    // TODO_FORMS: Implement form submit after backend work is complete
    // console.log(dataFormManager.ephemeralDataForm.getFormSubmitRequest());
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
