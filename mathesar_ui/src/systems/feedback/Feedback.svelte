<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import {
    Field,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import {
    iconExternalHyperlink,
    iconFeedback,
    iconSend,
  } from '@mathesar/icons';
  import { getMarketingLink } from '@mathesar/routes/urls';
  import {
    AnchorButton,
    DropdownMenu,
    Icon,
    TextArea,
  } from '@mathesar-component-library';

  const feedback = requiredField<string>('');

  let form = makeForm({ feedback });
  $: formRequestStatus = form.requestStatus;
  $: isSucessfullySubmitted = $formRequestStatus?.state === 'success';

  async function send() {
    await api.analytics
      .upload_feedback({
        message: $feedback,
      })
      .run();
  }

  function resetIfSubmitted() {
    const state = $formRequestStatus?.state;
    if (state === 'success' || state === 'failure') {
      feedback.reset();
      form = makeForm({ feedback });
    }
  }

  function onDropdownClose() {
    /**
     * When the dropdown closes,
     * - If feedback is not submitted,.
     *   - Persist the textarea content because the user might have closed the
     *     dropdown by accident.
     *   - If the request is underway when user closes dropdown, we still want
     *     them to see the survey link when they open again.
     * - If feedback has been submitted, reset everything including form
     *   submission state.
     */
    resetIfSubmitted();
  }
</script>

<div class="feedback-button">
  <DropdownMenu
    triggerAppearance="custom"
    size="small"
    closeOnInnerClick={false}
    showArrow={false}
    menuStyle="--Menu__padding-x: 0.3em;"
    on:close={onDropdownClose}
  >
    <div class="trigger" slot="trigger">
      <Icon {...iconFeedback} size="0.9em" />
      {$_('feedback')}
    </div>
    <div class="feedback-content">
      {#if !isSucessfullySubmitted}
        <div class="feedback-form">
          <div class="help">
            {$_('feedback_form_help')}
          </div>
          <Field
            field={feedback}
            input={{
              component: TextArea,
              props: {
                focusOnMount: true,
              },
            }}
          />
          <FormSubmit
            {form}
            catchErrors
            onProceed={send}
            cancelButton={{
              label: $_('clear'),
            }}
            proceedButton={{
              icon: iconSend,
              label: $_('send_feedback'),
            }}
          />
        </div>
      {:else}
        <div class="follow-up">
          <div class="title">
            {$_('thanks_for_feedback')}
          </div>
          <div>
            {$_('take_survey_understand_use_case')}
          </div>
          <div>
            <AnchorButton
              appearance="primary"
              href={getMarketingLink('survey')}
              target="_blank"
            >
              <span>{$_('go_to_survey')}</span>
              <Icon {...iconExternalHyperlink} />
            </AnchorButton>
          </div>
        </div>
      {/if}
    </div>
  </DropdownMenu>
</div>

<style lang="scss">
  .feedback-button {
    --button-border: none;
    --button-color: var(--yellow-300);
  }
  .trigger {
    display: flex;
    align-items: center;
    gap: var(--size-ultra-small);
  }
  .feedback-content {
    padding: var(--size-small);
    max-width: 28rem;
  }
  .feedback-form {
    display: flex;
    flex-direction: column;
    gap: var(--size-xx-small);
    --text-area-min-height: 6rem;

    .help {
      font-size: var(--size-small);
      color: var(--slate-500);
      margin-top: var(--size-extreme-small);
    }
  }
  .follow-up {
    display: flex;
    flex-direction: column;
    gap: var(--size-xx-small);

    .title {
      font-weight: var(--font-weight-medium);
    }
  }
</style>
