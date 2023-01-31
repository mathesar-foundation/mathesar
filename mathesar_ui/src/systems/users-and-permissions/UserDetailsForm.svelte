<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import {
    TextInput,
    PasswordInput,
    hasProperty,
  } from '@mathesar-component-library';
  import {
    optionalField,
    requiredField,
    makeForm,
    FormSubmitWithCatch,
  } from '@mathesar/components/form';
  import UserApi, { type User } from '@mathesar/api/users';
  import { iconSave, iconUndo } from '@mathesar/icons';
  import { extractDetailedFieldBasedErrors } from '@mathesar/api/utils/errors';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import SelectRole from './SelectRole.svelte';
  import UserFormInput from './UserFormInput.svelte';

  const dispatch = createEventDispatcher<{ create: User; update: undefined }>();
  const userProfileStore = getUserProfileStoreFromContext();
  $: loggedInUserDetails = $userProfileStore;

  export let userDetails: User | undefined = undefined;

  $: isUserUpdatingThemselves =
    loggedInUserDetails && loggedInUserDetails?.id === userDetails?.id;
  $: isNewUser = userDetails === undefined;
  $: fullname = optionalField(userDetails?.full_name ?? '');
  $: shortname = optionalField(userDetails?.short_name ?? '');
  $: username = requiredField(userDetails?.username ?? '');
  $: email = optionalField(userDetails?.email ?? '');
  $: role = requiredField<'user' | 'admin' | undefined>(
    userDetails?.is_superuser ? 'admin' : 'user',
  );

  const password = requiredField('');
  $: userDetails, password.reset();

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
      const newUser = await UserApi.add({
        ...request,
        password: formValues.password,
      });
      dispatch('create', newUser);
      return;
    }

    if (isUserUpdatingThemselves && loggedInUserDetails) {
      await loggedInUserDetails.update(request);
      dispatch('update');
      return;
    }

    if (userDetails) {
      await UserApi.update(userDetails.id, request);
      dispatch('update');
      return;
    }

    throw new Error('Unable to update user');
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
  <UserFormInput
    label="Full Name"
    field={fullname}
    input={{ component: TextInput }}
  />

  <UserFormInput
    label="Short Name"
    field={shortname}
    input={{ component: TextInput }}
  />

  <UserFormInput label="Email" field={email} input={{ component: TextInput }} />

  <UserFormInput
    label="Username *"
    field={username}
    input={{
      component: TextInput,
      props: { autocomplete: isNewUser ? 'new-username' : 'on' },
    }}
  />

  {#if isNewUser}
    <UserFormInput
      label="Password *"
      field={password}
      input={{
        component: PasswordInput,
        props: { autocomplete: isNewUser ? 'new-password' : 'on' },
      }}
    />
  {/if}

  <UserFormInput
    label="Role *"
    field={role}
    input={{
      component: SelectRole,
      props: { disabled: isUserUpdatingThemselves },
    }}
  />
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
  }
  .submit-section {
    --form-submit-margin: var(--size-xx-large) 0 0 0;
  }
</style>
