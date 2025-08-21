<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { FormSubmit } from '@mathesar/components/form';

  import {
    DataFormFillOutManager,
    type DataFormManager,
  } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: DataFormManager;

  $: ({ submitButtonLabel, formHolder } = dataFormManager.dataFormStructure);
  $: label = $submitButtonLabel?.trim() || $_('submit');
  $: form = $formHolder;

  async function submit() {
    if (dataFormManager instanceof DataFormFillOutManager) {
      await dataFormManager.submit();
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
    padding: var(--df__internal__element-spacing)
      var(--df__internal_element-right-padding)
      var(--df__internal__element-spacing)
      var(--df__internal_element-left-padding);
  }
</style>
