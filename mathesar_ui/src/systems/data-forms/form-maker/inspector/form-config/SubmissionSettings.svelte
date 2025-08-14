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
  $: ({ dataFormStructure } = dataFormManager);
  $: ({ submitMessage, submitRedirectUrl, submitButtonLabel } =
    dataFormStructure);
</script>

<div>
  <div>
    <LabeledInput layout="inline-input-first" label={$_('redirect_to_url')}>
      <Checkbox
        checked={isDefinedNonNullable($submitRedirectUrl)}
        on:change={(e) =>
          dataFormStructure.setSubmissionRedirectUrl(e.detail ? '' : null)}
      />
    </LabeledInput>
    {#if isDefinedNonNullable($submitRedirectUrl)}
      <div>
        <TextInput
          value={$submitRedirectUrl}
          on:input={(e) => {
            dataFormStructure.setSubmissionRedirectUrl(
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
          dataFormStructure.setSubmissionMessage(getStringValueFromEvent(e))}
      />
    </LabeledInput>
  </div>
  <div>
    <LabeledInput layout="stacked" label={$_('button_label')}>
      <TextInput
        value={$submitButtonLabel}
        on:input={(e) =>
          dataFormStructure.setSubmissionButtonLabel(
            getStringValueFromEvent(e),
          )}
      />
    </LabeledInput>
  </div>
</div>
