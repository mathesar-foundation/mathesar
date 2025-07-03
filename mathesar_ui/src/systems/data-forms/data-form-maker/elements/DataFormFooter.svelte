<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { CancelOrProceedButtonPair } from '@mathesar-component-library';
</script>

<div class="submit-buttons">
  <CancelOrProceedButtonPair
    cancelButton={{ label: $_('clear_form') }}
    proceedButton={{ label: $_('submit'), icon: undefined }}
  />
</div>

<style lang="scss">
  .submit-buttons {
    padding: var(--lg1);
  }
</style>
