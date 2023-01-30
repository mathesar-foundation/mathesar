<script lang="ts">
  import { TextInput, Button } from '@mathesar-component-library';
  import {
    requiredField,
    makeForm,
    FormSubmitWithCatch,
    optionalField,
  } from '@mathesar/components/form';
  import { iconSave } from '@mathesar/icons';
  import type { User } from '@mathesar/api/users';
  import UserFormInput from './UserFormInput.svelte';
  import UserFormInputRow from './UserFormInputRow.svelte';

  export let userId: User['id'];

  const oldPassword = requiredField('');
  const password = requiredField('');
  const confirmPassword = requiredField('');
  const passwordPlaceholder = optionalField('***************');
  let changePassword = false;

  $: form = makeForm({
    oldPassword,
    password,
    confirmPassword,
  });

  $: userId,
    (() => {
      changePassword = false;
      form.reset();
    })();

  async function updatePassword() {
    const formValues = $form.values;
    //
  }
</script>

<div class="password-change-form">
  {#if changePassword}
    <UserFormInputRow>
      <UserFormInput
        label="Old Password *"
        field={oldPassword}
        input={{ component: TextInput }}
        bypassRow
      />

      <div />
      <div />
    </UserFormInputRow>

    <UserFormInputRow>
      <UserFormInput
        label="New Password *"
        field={password}
        input={{ component: TextInput }}
        bypassRow
      />

      <UserFormInput
        label="Confirm Password *"
        field={confirmPassword}
        input={{ component: TextInput }}
        bypassRow
      />
    </UserFormInputRow>
  {:else}
    <UserFormInputRow>
      <UserFormInput
        label="Password"
        field={passwordPlaceholder}
        input={{ component: TextInput, props: { disabled: true } }}
        bypassRow
      />

      <div class="change-password-button cell">
        <Button
          appearance="secondary"
          on:click={() => {
            changePassword = true;
          }}
        >
          Change Password
        </Button>
      </div>
    </UserFormInputRow>
  {/if}
</div>

{#if changePassword}
  <div class="submit-section">
    <FormSubmitWithCatch
      {form}
      onProceed={updatePassword}
      onCancel={() => {
        changePassword = false;
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
