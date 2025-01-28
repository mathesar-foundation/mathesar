<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';
  import type { UnionToIntersection } from 'type-fest';

  import { extractDetailedFieldBasedErrors } from '@mathesar/api/rest/utils/errors';
  import { api } from '@mathesar/api/rpc';
  import type { BaseUser, User } from '@mathesar/api/rpc/users';
  import Help from '@mathesar/component-library/help/Help.svelte';
  import {
    type FieldStore,
    FormSubmit,
    isEmail,
    makeForm,
    matchRegex,
    maxLength,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import { GridForm, GridFormLabelRow } from '@mathesar/components/grid-form';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import { setLanguage } from '@mathesar/i18n';
  import { iconSave, iconUndo } from '@mathesar/icons';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    BooleanCheckbox,
    PasswordInput,
    TextInput,
    hasProperty,
  } from '@mathesar-component-library';

  import SelectDisplayLanguage from './SelectDisplayLanguage.svelte';

  const dispatch = createEventDispatcher<{ create: User; update: undefined }>();
  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  export let user: User | undefined = undefined;

  $: isUserUpdatingThemselves = userProfile && userProfile.id === user?.id;
  $: isNewUser = user === undefined;
  $: fullName = optionalField(user?.full_name ?? '');
  $: username = requiredField(user?.username ?? '', [
    maxLength(
      150,
      $_('username_max_length_error', {
        values: {
          maxLength: 150,
        },
      }),
    ),
    matchRegex(/^[A-Za-z0-9_@.+-]*$/, $_('username_restrict_chars_error')),
  ]);
  $: email = optionalField(user?.email ?? '', [isEmail()]);
  $: displayLanguage = requiredField(user?.display_language ?? 'en');
  $: isAdmin = requiredField(user?.is_superuser ?? false);

  const password = requiredField('');
  $: user, password.reset();

  $: formFields = (() => {
    const fields = { fullName, username, email, isAdmin, displayLanguage };
    return isNewUser ? { ...fields, password } : fields;
  })();
  $: form = makeForm(formFields);

  async function saveUser() {
    const formValues = $form.values;
    const baseUser: BaseUser = {
      full_name: formValues.fullName,
      username: formValues.username,
      email: formValues.email,
      display_language: formValues.displayLanguage,
    };

    if (isNewUser && hasProperty(formValues, 'password')) {
      const newUser = await api.users
        .add({
          user_def: {
            ...baseUser,
            password: formValues.password,
            is_superuser: formValues.isAdmin,
          },
        })
        .run();
      dispatch('create', newUser);
      return;
    }

    if (user) {
      if (isUserUpdatingThemselves && userProfileStore) {
        await api.users.patch_self(baseUser).run();
        userProfileStore.update((details) => details.with(baseUser));
        const updatedLocale = formValues.displayLanguage;
        await setLanguage(updatedLocale);
      } else {
        await api.users
          .patch_other({
            ...baseUser,
            user_id: user.id,
            is_superuser: formValues.isAdmin,
          })
          .run();
      }

      dispatch('update');
      return;
    }

    throw new Error($_('unable_to_update_user'));
  }

  function getErrorMessages(e: unknown) {
    type FieldKey = keyof UnionToIntersection<typeof formFields>;
    const { commonErrors, fieldSpecificErrors } =
      extractDetailedFieldBasedErrors<FieldKey>(e, {
        user_name: 'username',
        is_superuser: 'isAdmin',
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

<GridForm>
  <GridFormLabelRow label={$_('display_name')}>
    <Field field={fullName} />
  </GridFormLabelRow>

  <GridFormLabelRow label={$_('email')}>
    <Field field={email} />
  </GridFormLabelRow>

  <GridFormLabelRow label={`${$_('username')} *`}>
    <Field
      field={username}
      input={{
        component: TextInput,
        props: { autocomplete: isNewUser ? 'new-username' : 'on' },
      }}
    />
  </GridFormLabelRow>

  {#if isNewUser}
    <GridFormLabelRow label={`${$_('password')} *`}>
      <Field
        field={password}
        input={{
          component: PasswordInput,
          props: { autocomplete: isNewUser ? 'new-password' : 'on' },
        }}
      />
    </GridFormLabelRow>
  {/if}

  <GridFormLabelRow label={`${$_('display_language')} *`}>
    <Field
      field={displayLanguage}
      input={{
        component: SelectDisplayLanguage,
      }}
    />
  </GridFormLabelRow>

  <GridFormLabelRow label={$_('admin')}>
    <div class="admin-checkbox">
      <Field
        field={isAdmin}
        input={{
          component: BooleanCheckbox,
          props: { disabled: isUserUpdatingThemselves },
        }}
      />
      <Help>
        <p>{$_('admin_user_checkbox_help')}</p>
        <p><SeeDocsToLearnMore page="userAdmin" /></p>
      </Help>
    </div>
  </GridFormLabelRow>
</GridForm>

<div class="submit-section">
  <FormSubmit
    {form}
    catchErrors
    onProceed={saveUser}
    proceedButton={{ label: $_('save'), icon: iconSave }}
    cancelButton={{ label: $_('discard_changes'), icon: iconUndo }}
    {getErrorMessages}
    initiallyHidden={!!user}
    hasCancelButton={!!user}
  />
</div>

<style lang="scss">
  .admin-checkbox {
    min-height: 100%;
    display: flex;
    align-items: flex-end;
    gap: 0.7rem;
  }
  .submit-section {
    --form-submit-margin: var(--size-xx-large) 0 0 0;
  }
</style>
