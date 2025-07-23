<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { CancelOrProceedButtonPair } from '@mathesar-component-library';

  import type { DataFormManager } from '../data-form-utilities/DataFormManager';

  export let dataFormManager: DataFormManager;

  $: ({ submitButtonLabel } = dataFormManager.ephemeralDataForm);
  $: label = $submitButtonLabel?.trim() || $_('submit');
</script>

<div class="submit-buttons">
  <CancelOrProceedButtonPair
    cancelButton={{ label: $_('clear_form') }}
    proceedButton={{
      label,
      icon: undefined,
    }}
  />
</div>

<style lang="scss">
  .submit-buttons {
    padding: var(--lg1);
  }
</style>
