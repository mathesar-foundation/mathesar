<script lang="ts">
  import { fade } from 'svelte/transition';
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import {
    Field,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import { iconMessage, iconSend } from '@mathesar/icons';
  import { useCaseFeedbackVisible } from '@mathesar/stores/localStorage';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Icon, TextArea } from '@mathesar-component-library';

  const feedback = requiredField<string>('');
  const form = makeForm({ feedback });

  async function send() {
    try {
      await api.analytics
        .upload_feedback({
          message: $feedback,
        })
        .run();
      toast.success($_('usecase_feedback_sent_successfully'));
      form.reset();
      useCaseFeedbackVisible.set(false);
    } catch (err) {
      toast.error(
        `${$_('usecase_feedback_failed_to_send')}. ${getErrorMessage(err)}`,
      );
    }
  }
</script>

<div class="use-case-feedback" transition:fade={{ duration: 120 }}>
  <div class="header">
    <div class="icon">
      <Icon {...iconMessage} />
    </div>
    <div>
      <div class="title">
        {$_('what_are_you_using_mathesar_for')}
      </div>
      <div class="help">
        {$_('what_are_you_using_mathesar_for_help')}
      </div>
    </div>
  </div>
  <Field
    field={feedback}
    input={{
      component: TextArea,
    }}
  />
  <div class="footer">
    <FormSubmit
      {form}
      onProceed={send}
      hasCancelButton={false}
      proceedButton={{
        icon: iconSend,
        label: $_('send'),
        appearance: 'default',
      }}
    />
  </div>
</div>

<style lang="scss">
  .use-case-feedback {
    display: flex;
    flex-direction: column;
    gap: var(--size-xx-small);
    --text-area-min-height: 4.5rem;

    .header {
      display: flex;
      flex-direction: row;
      gap: var(--size-small);
      align-items: center;
    }
    .icon {
      font-size: 2rem;
      display: inline-flex;
      align-items: center;
    }
    .title {
      font-size: var(--size-large);
      font-weight: var(--font-weight-medium);
    }
    .help {
      font-size: var(--size-small);
      color: var(--slate-500);
      margin-top: var(--size-extreme-small);
    }
    .footer {
      text-align: right;
    }
  }
</style>
