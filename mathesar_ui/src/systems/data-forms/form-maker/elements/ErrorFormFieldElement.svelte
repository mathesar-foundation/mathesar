<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Button from '@mathesar/component-library/button/Button.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Icon } from '@mathesar-component-library';

  import {
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { ErrorField } from '../data-form-utilities/fields';

  import DataFormLabel from './DataFormLabel.svelte';

  export let isSelected: boolean;
  export let dataFormManager: DataFormManager;
  export let dataFormField: ErrorField;

  $: ({ error } = dataFormField);
</script>

<div class="error-field">
  <DataFormLabel disabled {dataFormManager} {dataFormField} {isSelected} />
  <div>
    <ErrorBox fullWidth>
      <div class="error-message">
        <div>
          {error.message}
        </div>
        {#if dataFormManager instanceof EditableDataFormManager}
          <div>
            <Button
              appearance="default"
              on:click={() => dataFormField.container.delete(dataFormField)}
            >
              <Icon {...iconDeleteMajor} />
              <span>{$_('remove_field')}</span>
            </Button>
          </div>
        {/if}
      </div>
    </ErrorBox>
  </div>
</div>

<style lang="scss">
  .error-field,
  .error-message {
    display: flex;
    flex-direction: column;
    gap: var(--data_forms__label-input-gap);
  }
</style>
