<script lang="ts">
  import {
    PasswordInput,
    Button,
    hasProperty,
  } from '@mathesar-component-library';
  import {
    requiredField,
    makeForm,
    FormSubmitWithCatch,
    optionalField,
    comboMustBeEqual,
  } from '@mathesar/components/form';
  import { iconSave } from '@mathesar/icons';
  import userApi, { type User } from '@mathesar/api/users';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import UserFormInput from './UserFormInput.svelte';
  import UserFormInputRow from './UserFormInputRow.svelte';

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
    comboMustBeEqual([password, confirmPassword], 'Passwords do not match'),
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
      await userApi.changePassword(formValues.oldPassword, formValues.password);
      /**
       * Once password changes, the session gets invalided.
       * We reload the page so that the user can login again.
       */
      window.location.reload();
    } else {
      // logged in user is updating someone else's password
      await userApi.resetPassword(userId, formValues.password);
      showChangePasswordForm = false;
    }
  }
</script>

<div class="password-change-form">
  {#if showChangePasswordForm}
    <div class="password-change-warning">
      <WarningBox fullWidth>
        {#if isUserUpdatingTheirOwnPassword}
          You'll be redirected to the login page once you change your password.
        {:else}
          Resetting the password will prompt the user to change their password
          on their next login.
        {/if}
      </WarningBox>
    </div>
  {/if}

  <div class="password-inputs">
    {#if showChangePasswordForm}
      {#if isUserUpdatingTheirOwnPassword}
        <UserFormInputRow>
          <UserFormInput
            label="Old Password *"
            field={oldPassword}
            input={{ component: PasswordInput }}
            bypassRow
          />

          <div />
          <div />
        </UserFormInputRow>
      {/if}

      <UserFormInputRow>
        <UserFormInput
          label="New Password *"
          field={password}
          input={{
            component: PasswordInput,
            props: { autocomplete: 'new-password' },
          }}
          bypassRow
        />

        <UserFormInput
          label="Confirm Password *"
          field={confirmPassword}
          input={{
            component: PasswordInput,
            props: { autocomplete: 'new-password' },
          }}
          bypassRow
        />
      </UserFormInputRow>
    {:else}
      <UserFormInputRow>
        <UserFormInput
          label="Password"
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
            Change Password
          </Button>
        </div>
      </UserFormInputRow>
    {/if}
  </div>

  {#if showChangePasswordForm}
    <div class="submit-section">
      <FormSubmitWithCatch
        {form}
        onProceed={updatePassword}
        onCancel={() => {
          showChangePasswordForm = false;
        }}
        proceedButton={{ label: 'Save', icon: iconSave }}
        cancelButton={{ label: 'Cancel' }}
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
