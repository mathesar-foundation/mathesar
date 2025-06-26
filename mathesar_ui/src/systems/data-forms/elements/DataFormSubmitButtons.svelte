<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { CancelOrProceedButtonPair } from '@mathesar-component-library';

  import type { DataFormManager } from '../DataFormManager';

  import SelectableElement from './SelectableElement.svelte';

  export let dataFormManager: DataFormManager;
</script>

<SelectableElement elementId="footer" {dataFormManager}>
  <div class="submit-buttons">
    <CancelOrProceedButtonPair
      cancelButton={{ label: $_('clear_form') }}
      proceedButton={{ label: $_('submit'), icon: undefined }}
    />
  </div>
</SelectableElement>

<style lang="scss">
  .submit-buttons {
    padding: var(--sm1);
  }
</style>
