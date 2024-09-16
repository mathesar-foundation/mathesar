<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import AppendBreadcrumb from '@mathesar/components/breadcrumb/AppendBreadcrumb.svelte';
  import FormBox from '@mathesar/components/form/FormBox.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconDeleteMajor, iconEditUser } from '@mathesar/icons';
  import {
    ADMIN_USERS_PAGE_URL,
    getEditUsersPageUrl,
  } from '@mathesar/routes/urls';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import type { UserModel } from '@mathesar/stores/users';
  import { getUsersStoreFromContext } from '@mathesar/stores/users';
  import { PasswordChangeForm, UserDetailsForm } from '@mathesar/systems/users';
  import { Icon, SpinnerButton } from '@mathesar-component-library';

  const userProfileStore = getUserProfileStoreFromContext();
  const usersStore = getUsersStoreFromContext();

  export let userId: number;

  $: requestStatus = usersStore?.requestStatus;
  $: userDetailsPromise = usersStore?.getUserDetails(userId);
  $: userIsLoggedInUser = $userProfileStore?.id === userId;

  async function onUserUpdate() {
    await usersStore?.fetchUsers();
    userDetailsPromise = usersStore?.getUserDetails(userId);
  }

  async function deleteUser(user: UserModel) {
    if (!usersStore) {
      return;
    }
    try {
      await usersStore.delete(user.id);
      router.goto(ADMIN_USERS_PAGE_URL);
    } catch (e) {
      toast.fromError(e);
    }
  }
</script>

{#await userDetailsPromise}
  {$_('fetching_user_details')}
{:then userModel}
  {#if userModel === undefined}
    {#if $requestStatus?.state === 'failure'}
      {$requestStatus.errors}
    {:else}
      <ErrorBox>{$_('user_not_found')}</ErrorBox>
    {/if}
  {:else}
    <AppendBreadcrumb
      item={{
        type: 'simple',
        href: getEditUsersPageUrl(userId),
        label: userModel.username,
        icon: iconEditUser,
      }}
    />
    <h1>
      <Icon {...iconEditUser} />
      {$_('edit_user')}: <strong>{userModel.username}</strong>
    </h1>
    <FormBox>
      <UserDetailsForm user={userModel.getUser()} on:update={onUserUpdate} />
    </FormBox>
    <FormBox>
      <PasswordChangeForm {userId} />
    </FormBox>
    {#if !userIsLoggedInUser}
      <FormBox>
        <SpinnerButton
          confirm={() =>
            confirmDelete({
              identifierName: userModel.username,
              identifierType: $_('user'),
            })}
          onClick={() => deleteUser(userModel)}
          icon={iconDeleteMajor}
          danger
          label={$_('delete_user')}
          appearance="default"
        />
      </FormBox>
    {/if}
  {/if}
{/await}
