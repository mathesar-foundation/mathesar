<script lang="ts">
  import { _ } from 'svelte-i18n';

  import ErrorList from '@mathesar/components/errors/ErrorList.svelte';
  import { FormSubmit } from '@mathesar/components/form';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { Collapsible } from '@mathesar-component-library';

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
  >
    <div class="error-container" slot="errors" let:errors>
      <ErrorBox fullWidth>
        <div>
          {$_('error_submitting_form')}
        </div>
        <div class="error-detail">
          <Collapsible triggerAppearance="ghost">
            <span slot="header">
              {$_('view_details')}
            </span>
            <div slot="content">
              <ErrorList errorStrings={errors} />
            </div>
          </Collapsible>
        </div>
      </ErrorBox>
    </div>
  </FormSubmit>
</div>

<style lang="scss">
  .submit-buttons {
    padding: var(--df__internal__element-spacing)
      var(--df__internal_element-right-padding)
      var(--df__internal__element-spacing)
      var(--df__internal_element-left-padding);
  }
  .error-detail {
    --Collapsible_trigger-padding: 0;
    margin-top: var(--sm5);
  }
</style>
