<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { UnionToIntersection } from 'type-fest';

  import {
    PasswordInput,
    TextInput,
    hasProperty,
  } from '@mathesar-component-library';
  import userApi, { type User } from '@mathesar/api/users';
  import { extractDetailedFieldBasedErrors } from '@mathesar/api/utils/errors';
  import {
    FormSubmit,
    isEmail,
    makeForm,
    matchRegex,
    maxLength,
    optionalField,
    requiredField,
    type FieldStore,
  } from '@mathesar/components/form';
  import { iconSave, iconUndo } from '@mathesar/icons';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import GridFormInput from '@mathesar/components/form/GridFormInput.svelte';
  import { locale, setLocale } from '@mathesar/i18n/i18n-svelte';
  import { loadLocaleAsync } from '@mathesar/i18n/i18n-load';
  import { baseLocale } from '@mathesar/i18n/i18n-util';
  import SelectUserType from './SelectUserType.svelte';
  import SelectDisplayLanguage from './SelectDisplayLanguage.svelte';

  const dispatch = createEventDispatcher<{ create: User; update: undefined }>();
  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  export let user: User | undefined = undefined;

  $: isUserUpdatingThemselves = userProfile && userProfile.id === user?.id;
  $: isNewUser = user === undefined;
  $: fullName = optionalField(user?.full_name ?? '');
  $: username = requiredField(user?.username ?? '', [
    maxLength(150, 'Username cannot be longer than 150 characters.'),
    matchRegex(
      /^[A-Za-z0-9_@.+-]*$/,
      'Username can only contain alphanumeric characters, _, @, +, ., and -.',
    ),
  ]);
  $: email = optionalField(user?.email ?? '', [isEmail()]);
  $: displayLanguage = requiredField(user?.display_language ?? baseLocale);
  $: userType = requiredField<'user' | 'admin' | undefined>(
    user?.is_superuser ? 'admin' : 'user',
  );

  const password = requiredField('');
  $: user, password.reset();

  $: formFields = (() => {
    const fields = { fullName, username, email, userType, displayLanguage };
    return isNewUser ? { ...fields, password } : fields;
  })();
  $: form = makeForm(formFields);

  async function saveUser() {
    const formValues = $form.values;
    const request = {
      full_name: formValues.fullName,
      username: formValues.username,
      email: formValues.email,
      is_superuser: formValues.userType === 'admin',
      display_language: formValues.displayLanguage,
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

      const updatedLocale = request.display_language;
      if ($locale !== updatedLocale) {
        await loadLocaleAsync(updatedLocale);
        setLocale(updatedLocale);
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
        is_superuser: 'userType',
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
  <GridFormInput
    label="Display Name"
    field={fullName}
    input={{ component: TextInput }}
  />

  <GridFormInput label="Email" field={email} input={{ component: TextInput }} />

  <GridFormInput
    label="Username *"
    field={username}
    input={{
      component: TextInput,
      props: { autocomplete: isNewUser ? 'new-username' : 'on' },
    }}
  />

  {#if isNewUser}
    <GridFormInput
      label="Password *"
      field={password}
      input={{
        component: PasswordInput,
        props: { autocomplete: isNewUser ? 'new-password' : 'on' },
      }}
    />
  {/if}

  <!-- Commenting this for now to avoid releasing any half baked changes to develop branch -->
  <!-- <GridFormInput
    label="Display Language *"
    field={displayLanguage}
    input={{
      component: SelectDisplayLanguage,
    }}
  /> -->

  <GridFormInput
    label="Role *"
    field={userType}
    input={{
      component: SelectUserType,
      props: { disabled: isUserUpdatingThemselves },
    }}
  />
</div>

<div class="submit-section">
  <FormSubmit
    {form}
    catchErrors
    onProceed={saveUser}
    proceedButton={{ label: 'Save', icon: iconSave }}
    cancelButton={{ label: 'Discard Changes', icon: iconUndo }}
    {getErrorMessages}
    initiallyHidden={!!user}
    hasCancelButton={!!user}
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
