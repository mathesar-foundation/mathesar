<script lang="ts">
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import { FormSubmit } from '@mathesar/components/form';
  import { RpcError } from '@mathesar/packages/json-rpc-client-builder';
  import { toast } from '@mathesar/stores/toast';

  import {
    type DataFormManager,
    ReadonlyDataFormManager,
  } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: DataFormManager;

  $: ({ submitButtonLabel, formHolder } = dataFormManager.dataFormStructure);
  $: label = $submitButtonLabel?.trim() || $_('submit');
  $: form = $formHolder;

  async function submit() {
    if (dataFormManager instanceof ReadonlyDataFormManager) {
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
