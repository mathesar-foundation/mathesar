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
    invalidIf,
  } from '@mathesar/components/form';
  import { iconSave } from '@mathesar/icons';
  import UserApi, { type User } from '@mathesar/api/users';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import UserFormInput from './UserFormInput.svelte';
  import UserFormInputRow from './UserFormInputRow.svelte';

  const userProfileStore = getUserProfileStoreFromContext();
  $: loggedInUserDetails = $userProfileStore;

  export let userId: User['id'];
  $: isUserUpdatingTheirOwnPassword = loggedInUserDetails?.id === userId;

  const oldPassword = requiredField('');
  const password = requiredField('');
  const confirmPassword = requiredField('', [
    invalidIf((pw: string) => pw !== $password, 'Passwords do not match'),
  ]);
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
  $: form = makeForm(formFields);

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
      await UserApi.changePassword(formValues.oldPassword, formValues.password);
    } else {
      // logged in user is updating someone else's password
      await UserApi.resetPassword(userId, formValues.password);
    }
    showChangePasswordForm = false;
  }
</script>

<div class="password-change-form">
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
        input={{ component: PasswordInput }}
        bypassRow
      />

      <UserFormInput
        label="Confirm Password *"
        field={confirmPassword}
        input={{ component: PasswordInput }}
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

<style lang="scss">
  .password-change-form {
    display: grid;
    grid-template-columns: repeat(4, 1fr);

    .change-password-button {
      margin-left: var(--size-large);
    }
  }
  .submit-section {
    --form-submit-margin: var(--size-xx-large) 0 0 0;
  }
</style>
