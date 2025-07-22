<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { CancelOrProceedButtonPair } from '@mathesar-component-library';

  import type { DataFormManager } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: DataFormManager;

  $: ({ submissionSettings } = dataFormManager.ephemeralDataForm);
  $: submitButtonLabel = $submissionSettings.buttonLabel?.trim();
</script>

<div class="submit-buttons">
  <CancelOrProceedButtonPair
    cancelButton={{ label: $_('clear_form') }}
    proceedButton={{
      label: submitButtonLabel || $_('submit'),
      icon: undefined,
    }}
  />
</div>

<style lang="scss">
  .submit-buttons {
    padding: var(--lg1);
  }
</style>
