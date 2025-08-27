<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Button from '@mathesar/component-library/button/Button.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import { Icon, type LabelController } from '@mathesar-component-library';

  import {
    DataFormFillOutManager,
    type DataFormManager,
    EditableDataFormManager,
  } from '../data-form-utilities/DataFormManager';
  import type { ErrorField } from '../data-form-utilities/fields';

  import DataFormLabel from './DataFormLabel.svelte';

  export let isSelected: boolean;
  export let dataFormManager: DataFormManager;
  export let dataFormField: ErrorField;
  export let labelController: LabelController;

  $: labelController.disabled.set(true);
  $: ({ error } = dataFormField);
  $: errorMessage =
    dataFormManager instanceof DataFormFillOutManager
      ? `${$_('error')}: ${error.message}`
      : error.message;
</script>

<div class="error-field">
  <DataFormLabel
    disabled
    {dataFormManager}
    {dataFormField}
    {isSelected}
    {labelController}
  />
  <div>
    <ErrorBox fullWidth>
      <div class="error-message">
        {#if dataFormManager instanceof DataFormFillOutManager}
          <div>
            {$_('form_has_errors_contact_admin')}
          </div>
        {/if}
        <div>
          {errorMessage}
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
    gap: var(--df__internal__label-input-gap);
  }
</style>
