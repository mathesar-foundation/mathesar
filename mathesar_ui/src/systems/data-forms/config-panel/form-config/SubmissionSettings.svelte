<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    Checkbox,
    LabeledInput,
    TextArea,
    TextInput,
    getValueFromEvent,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';

  export let dataFormManager: EditableDataFormManager;
  $: ({ ephemeralDataForm } = dataFormManager);
  $: ({ submissionSettings } = ephemeralDataForm);
  $: ({ message, redirectUrl, buttonLabel } = $submissionSettings);
</script>

<div>
  <div>
    <LabeledInput layout="inline-input-first" label={$_('redirect_to_url')}>
      <Checkbox
        checked={isDefinedNonNullable(redirectUrl)}
        on:change={(e) =>
          ephemeralDataForm.setSubmissionRedirectUrl(e.detail ? '' : null)}
      />
    </LabeledInput>
    {#if isDefinedNonNullable(redirectUrl)}
      <div>
        <TextInput
          value={redirectUrl}
          on:input={(e) => {
            ephemeralDataForm.setSubmissionRedirectUrl(
              String(getValueFromEvent(e)),
            );
          }}
        />
      </div>
    {/if}
  </div>
  <div>
    <LabeledInput layout="stacked" label={$_('post_submission_message')}>
      <TextArea
        value={message?.text}
        on:input={(e) =>
          ephemeralDataForm.setSubmissionMessage(String(getValueFromEvent(e)))}
      />
    </LabeledInput>
  </div>
  <div>
    <LabeledInput layout="stacked" label={$_('submit_button_label')}>
      <TextInput
        value={buttonLabel}
        on:input={(e) =>
          ephemeralDataForm.setSubmissionButtonLabel(
            String(getValueFromEvent(e)),
          )}
      />
    </LabeledInput>
  </div>
</div>
