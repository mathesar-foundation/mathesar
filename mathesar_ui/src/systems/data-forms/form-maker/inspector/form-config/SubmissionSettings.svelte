<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    Checkbox,
    Fieldset,
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

<Fieldset boxed>
  <span class="header" slot="label">
    {$_('appearance')}
  </span>
  <section>
    <LabeledInput layout="stacked" label={$_('button_label')}>
      <TextInput
        placeholder={$_('submit')}
        value={$submitButtonLabel}
        on:input={(e) =>
          dataFormStructure.setSubmissionButtonLabel(
            getStringValueFromEvent(e),
          )}
      />
    </LabeledInput>
  </section>
</Fieldset>

<Fieldset boxed>
  <span class="header" slot="label">
    {$_('after_submission')}
  </span>
  <section>
    <LabeledInput layout="stacked" label={$_('confirmation_message')}>
      <TextArea
        placeholder={$_('thank_you_for_submitting_form')}
        value={$submitMessage?.text}
        on:input={(e) =>
          dataFormStructure.setSubmissionMessage(getStringValueFromEvent(e))}
      />
    </LabeledInput>
    <LabeledInput layout="inline-input-first" label={$_('redirect_to_url')}>
      <Checkbox
        checked={isDefinedNonNullable($submitRedirectUrl)}
        on:change={(e) =>
          dataFormStructure.setSubmissionRedirectUrl(e.detail ? '' : null)}
      />
    </LabeledInput>
    {#if isDefinedNonNullable($submitRedirectUrl)}
      <TextInput
        value={$submitRedirectUrl}
        on:input={(e) => {
          dataFormStructure.setSubmissionRedirectUrl(
            getStringValueFromEvent(e),
          );
        }}
      />
    {/if}
  </section>
</Fieldset>

<style lang="scss">
  .header {
    font-weight: var(--font-weight-medium);
  }
  section {
    display: flex;
    flex-direction: column;
    gap: var(--sm2);
  }
</style>
