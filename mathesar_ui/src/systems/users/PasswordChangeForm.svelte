<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import type { User } from '@mathesar/api/rpc/users';
  import {
    FormSubmit,
    comboMustBeEqual,
    makeForm,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import GridFormInput from '@mathesar/components/form/GridFormInput.svelte';
  import GridFormInputRow from '@mathesar/components/form/GridFormInputRow.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { iconSave } from '@mathesar/icons';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    Button,
    PasswordInput,
    hasProperty,
  } from '@mathesar-component-library';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  export let userId: User['id'];
  $: isUserUpdatingTheirOwnPassword = userProfile?.id === userId;

  const oldPassword = requiredField('');
  const password = requiredField('');
  const confirmPassword = requiredField('');
  const passwordPlaceholder = optionalField('***************');
  let showChangePasswordForm = false;

  $: formFields = (() => {
    const fields = {
      password,
      confirmPassword,
    };
    return isUserUpdatingTheirOwnPassword
      ? {
          ...fields,
          oldPassword,
        }
      : fields;
  })();
  $: form = makeForm(formFields, [
    comboMustBeEqual([password, confirmPassword], $_('passwords_do_not_match')),
  ]);

  $: userId,
    (() => {
      showChangePasswordForm = false;
      form.reset();
    })();

  async function updatePassword() {
    const formValues = $form.values;
    if (
      isUserUpdatingTheirOwnPassword &&
      hasProperty(formValues, 'oldPassword')
    ) {
      // logged in user is updating their own password
      await api.users.password
        .replace_own({
          user_id: userId,
          old_password: formValues.oldPassword,
          new_password: formValues.password,
        })
        .run();
      /**
       * Once password changes, the session gets invalided.
       * We reload the page so that the user can login again.
       */
      window.location.reload();
    } else {
      // logged in user is updating someone else's password
      await api.users.password
        .revoke({ user_id: userId, new_password: formValues.password })
        .run();
      showChangePasswordForm = false;
    }
  }
</script>

<div class="password-change-form">
  {#if showChangePasswordForm}
    <div class="password-change-warning">
      <WarningBox fullWidth>
        {#if isUserUpdatingTheirOwnPassword}
          {$_('redirected_login_page_password_change')}
        {:else}
          {$_('prompt_new_password_next_login')}
        {/if}
      </WarningBox>
    </div>
  {/if}

  <div class="password-inputs">
    {#if showChangePasswordForm}
      {#if isUserUpdatingTheirOwnPassword}
        <GridFormInputRow>
          <GridFormInput
            label={`${$_('old_password')} *`}
            field={oldPassword}
            input={{ component: PasswordInput }}
            bypassRow
          />

          <div />
          <div />
        </GridFormInputRow>
      {/if}

      <GridFormInputRow>
        <GridFormInput
          label={`${$_('new_password')} *`}
          field={password}
          input={{
            component: PasswordInput,
            props: { autocomplete: 'new-password' },
          }}
          bypassRow
        />

        <GridFormInput
          label={`${$_('confirm_password')} *`}
          field={confirmPassword}
          input={{
            component: PasswordInput,
            props: { autocomplete: 'new-password' },
          }}
          bypassRow
        />
      </GridFormInputRow>
    {:else}
      <GridFormInputRow>
        <GridFormInput
          label={$_('password')}
          field={passwordPlaceholder}
          input={{ component: PasswordInput, props: { disabled: true } }}
          bypassRow
        />

        <div class="change-password-button cell">
          <Button
            appearance="secondary"
            on:click={() => {
              showChangePasswordForm = true;
            }}
          >
            {$_('change_password')}
          </Button>
        </div>
      </GridFormInputRow>
    {/if}
  </div>

  {#if showChangePasswordForm}
    <div class="submit-section">
      <FormSubmit
        {form}
        catchErrors
        onProceed={updatePassword}
        onCancel={() => {
          showChangePasswordForm = false;
        }}
        proceedButton={{ label: $_('save'), icon: iconSave }}
        cancelButton={{ label: $_('cancel') }}
      />
    </div>
  {/if}
</div>

<style lang="scss">
  .password-change-form {
    .password-change-warning {
      margin-bottom: var(--size-large);
    }

    .password-inputs {
      display: grid;
      grid-template-columns: repeat(4, 1fr);

      .change-password-button {
        margin-left: var(--size-large);
      }
    }
    .submit-section {
      --form-submit-margin: var(--size-xx-large) 0 0 0;
    }
  }
</style>
