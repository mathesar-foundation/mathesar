<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    Checkbox,
    LabeledInput,
    TextArea,
    TextInput,
    getStringValueFromEvent,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';

  export let dataFormManager: EditableDataFormManager;
  $: ({ ephemeralDataForm } = dataFormManager);
  $: ({ submitMessage, submitRedirectUrl, submitButtonLabel } =
    ephemeralDataForm);
</script>

<div>
  <div>
    <LabeledInput layout="inline-input-first" label={$_('redirect_to_url')}>
      <Checkbox
        checked={isDefinedNonNullable($submitRedirectUrl)}
        on:change={(e) =>
          ephemeralDataForm.setSubmissionRedirectUrl(e.detail ? '' : null)}
      />
    </LabeledInput>
    {#if isDefinedNonNullable($submitRedirectUrl)}
      <div>
        <TextInput
          value={$submitRedirectUrl}
          on:input={(e) => {
            ephemeralDataForm.setSubmissionRedirectUrl(
              getStringValueFromEvent(e),
            );
          }}
        />
      </div>
    {/if}
  </div>
  <div>
    <LabeledInput layout="stacked" label={$_('post_submission_message')}>
      <TextArea
        value={$submitMessage?.text}
        on:input={(e) =>
          ephemeralDataForm.setSubmissionMessage(getStringValueFromEvent(e))}
      />
    </LabeledInput>
  </div>
  <div>
    <LabeledInput layout="stacked" label={$_('submit_button_label')}>
      <TextInput
        value={$submitButtonLabel}
        on:input={(e) =>
          ephemeralDataForm.setSubmissionButtonLabel(
            getStringValueFromEvent(e),
          )}
      />
    </LabeledInput>
  </div>
</div>
