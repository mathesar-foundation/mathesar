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

  export let compactLayout = false;

  let form = makeForm({ feedback });
  $: formRequestStatus = form.requestStatus;
  $: isSuccessfullySubmitted = $formRequestStatus?.state === 'success';

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
    closeOnInnerClick={false}
    showArrow={false}
    menuStyle="--Menu__padding-x: 0.3em;"
    on:close={onDropdownClose}
  >
    <div class="trigger" slot="trigger">
      <Icon {...iconFeedback} size="0.8em" />
      {#if !compactLayout}
        {$_('feedback')}
      {/if}
    </div>
    <div class="feedback-content">
      {#if !isSuccessfullySubmitted}
        <div class="feedback-form">
          {#if compactLayout}
            <div class="title">{$_('feedback')}</div>
          {/if}
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
            size="small"
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
              size="small"
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
  }
  .trigger {
    display: flex;
    align-items: center;
    gap: var(--sm4);
    color: var(--text-color-primary);
  }
  .feedback-content {
    padding: var(--sm1);
    max-width: 28rem;
    background-color: var(--card-background);
    border: 1px solid var(--card-border);
    border-radius: var(--border-radius-m);
  }
  .feedback-form {
    display: flex;
    flex-direction: column;
    gap: var(--sm3);
    --text-area-min-height: 6rem;

    .help {
      font-size: var(--sm1);
      color: var(--text-color-secondary);
      margin-top: var(--sm6);
    }
  }
  .follow-up {
    display: flex;
    flex-direction: column;
    gap: var(--sm3);

    .title {
      font-weight: var(--font-weight-medium);
      color: var(--text-color-primary);
    }
  }
</style>
