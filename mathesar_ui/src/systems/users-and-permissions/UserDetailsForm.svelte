<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { UnionToIntersection } from 'type-fest';

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
    type FieldStore,
  } from '@mathesar/components/form';
  import userApi, { type User } from '@mathesar/api/users';
  import { iconSave, iconUndo } from '@mathesar/icons';
  import { extractDetailedFieldBasedErrors } from '@mathesar/api/utils/errors';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import SelectRole from './SelectRole.svelte';
  import UserFormInput from './UserFormInput.svelte';

  const dispatch = createEventDispatcher<{ create: User; update: undefined }>();
  const userProfileStore = getUserProfileStoreFromContext();
  $: loggedInUserDetails = $userProfileStore;

  export let user: User | undefined = undefined;

  $: isUserUpdatingThemselves =
    loggedInUserDetails && loggedInUserDetails?.id === user?.id;
  $: isNewUser = user === undefined;
  $: fullName = optionalField(user?.full_name ?? '');
  $: username = requiredField(user?.username ?? '');
  $: email = optionalField(user?.email ?? '');
  $: role = requiredField<'user' | 'admin' | undefined>(
    user?.is_superuser ? 'admin' : 'user',
  );

  const password = requiredField('');
  $: user, password.reset();

  $: formFields = (() => {
    const fields = {
      fullName,
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
      full_name: formValues.fullName,
      username: formValues.username,
      email: formValues.email,
    };

    if (isNewUser && hasProperty(formValues, 'password')) {
      const newUser = await userApi.add({
        ...request,
        password: formValues.password,
      });
      dispatch('create', newUser);
      return;
    }

    if (user) {
      await userApi.update(user.id, request);
      if (isUserUpdatingThemselves && userProfileStore) {
        userProfileStore.update((details) => details.with(request));
      }
      dispatch('update');
      return;
    }

    throw new Error('Unable to update user');
  }

  function getErrorMessages(e: unknown) {
    type FieldKey = keyof UnionToIntersection<typeof formFields>;
    const { commonErrors, fieldSpecificErrors } =
      extractDetailedFieldBasedErrors<FieldKey>(e, {
        user_name: 'username',
        is_superuser: 'role',
      });
    for (const [fieldKey, errors] of fieldSpecificErrors) {
      const combinedFields = form.fields as Partial<
        Record<FieldKey, FieldStore<unknown>>
      >;
      const field = combinedFields[fieldKey];
      if (field) {
        field.serverErrors.set(errors);
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
    field={fullName}
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
