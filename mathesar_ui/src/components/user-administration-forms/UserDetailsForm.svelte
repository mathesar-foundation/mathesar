<script lang="ts">
  import { TextInput, hasProperty } from '@mathesar-component-library';
  import {
    optionalField,
    requiredField,
    makeForm,
    Field,
    FormSubmitWithCatch,
  } from '@mathesar/components/form';
  import type { User, UnsavedUser } from '@mathesar/api/users';
  import { iconSave, iconUndo } from '@mathesar/icons';
  import { extractDetailedFieldBasedErrors } from '@mathesar/api/utils/errors';
  import SelectRole from './SelectRole.svelte';
  import UserFormInput from './UserFormInput.svelte';

  export let userDetails: User | undefined = undefined;
  export let saveUserDetails: (
    props:
      | { type: 'new'; request: UnsavedUser }
      | { type: 'existing'; request: Omit<UnsavedUser, 'password'> },
  ) => Promise<unknown>;

  $: isNewUser = userDetails === undefined;
  $: fullname = optionalField(userDetails?.full_name ?? '');
  $: shortname = optionalField(userDetails?.short_name ?? '');
  $: username = requiredField(userDetails?.username ?? '');
  $: email = optionalField(userDetails?.email ?? '');
  $: role = requiredField<'user' | 'admin' | undefined>(
    userDetails?.is_superuser ? 'admin' : 'user',
  );
  $: password = requiredField('');

  $: formFields = (() => {
    const fields = {
      fullname,
      shortname,
      username,
      email,
    };
    return isNewUser
      ? {
          ...fields,
          role,
          password,
        }
      : fields;
  })();
  $: form = makeForm(formFields);

  async function saveUser() {
    const formValues = $form.values;
    const request = {
      full_name: formValues.fullname,
      short_name: formValues.shortname,
      username: formValues.username,
      email: formValues.email,
    };
    if (isNewUser && hasProperty(formValues, 'password')) {
      await saveUserDetails({
        type: 'new',
        request: {
          ...request,
          password: formValues.password,
        },
      });
    }
    await saveUserDetails({ type: 'existing', request });
  }

  function getErrorMessages(e: unknown) {
    type FieldKey = keyof typeof formFields;
    const { commonErrors, fieldSpecificErrors } =
      extractDetailedFieldBasedErrors<FieldKey>(e, {
        user_name: 'username',
        short_name: 'shortname',
        is_superuser: 'role',
      });
    for (const [f, errors] of fieldSpecificErrors) {
      if (form.fields[f]) {
        form.fields[f].serverErrors.set(errors);
      } else {
        /**
         * Incase an error occurs when the server returned field
         * is not part of the form.
         * Ideally this should never happen.
         */
        commonErrors.push(...errors);
      }
    }
    return commonErrors;
  }
</script>

<div class="user-details-form">
  <UserFormInput label="Full Name">
    <Field field={fullname} input={{ component: TextInput }} />
  </UserFormInput>

  <UserFormInput label="Short Name">
    <Field field={shortname} input={{ component: TextInput }} />
  </UserFormInput>

  <UserFormInput label="Email">
    <Field field={email} input={{ component: TextInput }} />
  </UserFormInput>

  <UserFormInput label="Username *">
    <Field field={username} input={{ component: TextInput }} />
  </UserFormInput>

  {#if isNewUser}
    <UserFormInput label="Password *">
      <Field field={password} input={{ component: TextInput }} />
    </UserFormInput>
  {/if}

  <UserFormInput label="Role *">
    <Field
      field={role}
      input={{ component: SelectRole, props: { disabled: !isNewUser } }}
    />
  </UserFormInput>
</div>

<div class="submit-section">
  <FormSubmitWithCatch
    {form}
    onProceed={saveUser}
    proceedButton={{ label: 'Save', icon: iconSave }}
    cancelButton={{ label: 'Discard Changes', icon: iconUndo }}
    {getErrorMessages}
    initiallyHidden
  />
</div>

<style lang="scss">
  .user-details-form {
    display: grid;
    grid-template-columns: 1fr 3fr;
    grid-gap: var(--size-large);
  }
  .submit-section {
    --form-submit-margin: var(--size-xx-large) 0 0 0;
  }
</style>
