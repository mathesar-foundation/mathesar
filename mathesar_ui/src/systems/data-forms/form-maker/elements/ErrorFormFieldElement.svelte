<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { DataFormManager } from '../data-form-utilities/DataFormManager';
  import type { ErrorField } from '../data-form-utilities/fields';

  import DataFormLabel from './DataFormLabel.svelte';

  export let isSelected: boolean;
  export let dataFormManager: DataFormManager;
  export let dataFormField: ErrorField;
</script>

<div class="error-field">
  <DataFormLabel disabled {dataFormManager} {dataFormField} {isSelected} />
  <div>
    {$_('error')}
  </div>
</div>

<style lang="scss">
  .error-field {
    display: flex;
    flex-direction: column;
    gap: var(--data_forms__label-input-gap);
  }
</style>
