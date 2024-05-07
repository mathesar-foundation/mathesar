<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { UserRole } from '@mathesar/api/rest/users';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import type { UserModel } from '@mathesar/stores/users';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import {
    type AccessControlObject,
    type ObjectRoleMap,
    getDisplayNameForRole,
  } from '@mathesar/utils/permissions';
  import {
    Button,
    Help,
    Icon,
    LabeledInput,
    Select,
    SpinnerButton,
  } from '@mathesar-component-library';

  import AccessControlRow from './AccessControlRow.svelte';

  const roles: UserRole[] = ['viewer', 'editor', 'manager'];

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;

  export let usersWithAccess: UserModel[];
  export let usersWithoutAccess: UserModel[];
  export let addAccessForUser: (
    user: UserModel,
    role: UserRole,
  ) => Promise<void>;
  export let removeAccessForUser: (user: UserModel) => Promise<void>;
  export let accessControlObject: AccessControlObject;
  export let getUserRoles: (user: UserModel) => ObjectRoleMap | undefined;

  $: usersAllowedToBeAdded = usersWithoutAccess.filter(
    (user) => user.id !== userProfile?.id,
  );

  let isRequestInProcess = false;
  let showAddForm = false;
  let error: string | undefined;

  let user: UserModel | undefined = undefined;
  let role: UserRole = 'viewer';

  async function addAccess() {
    error = undefined;
    if (user) {
      try {
        isRequestInProcess = true;
        await addAccessForUser(user, role);
        user = undefined;
      } catch (err) {
        error = getErrorMessage(err);
      } finally {
        isRequestInProcess = false;
      }
    }
  }
</script>

<div>
  {#if !showAddForm}
    <Button
      appearance="secondary"
      on:click={() => {
        showAddForm = true;
        error = undefined;
      }}
    >
      <Icon {...iconAddNew} />
      <span>{$_('add')}</span>
    </Button>
  {/if}

  {#if showAddForm}
    <div class="add-user">
      <div class="add-user-form">
        <LabeledInput label={$_('user')} layout="stacked">
          <Select
            autoSelect="none"
            options={usersAllowedToBeAdded}
            bind:value={user}
            disabled={isRequestInProcess}
            let:option
          >
            {#if option}
              {option.username}
            {:else}
              <span class="placeholder">{$_('select_user')}</span>
            {/if}
            <div class="no-users" slot="empty">{$_('no_users_found')}</div>
          </Select>
        </LabeledInput>
        <LabeledInput label={$_('permission')} layout="stacked">
          <Select
            options={roles}
            bind:value={role}
            getLabel={(option) =>
              option ? getDisplayNameForRole(option) : $_('select_permission')}
            disabled={isRequestInProcess}
          />
        </LabeledInput>
        <div class="add-button">
          <SpinnerButton
            disabled={!user || isRequestInProcess}
            onClick={addAccess}
            icon={iconAddNew}
            label={$_('add')}
            appearance="secondary"
          />
        </div>
      </div>

      {#if error}
        <ErrorBox>{error}</ErrorBox>
      {/if}
    </div>
  {/if}
</div>
<div class="users-with-access">
  <div class="header">
    <span>{$_('users_with_access')}</span>
    {#if accessControlObject === 'schema'}
      <Help>
        {$_('access_level_precedence_help')}
      </Help>
    {/if}
  </div>
  <div class="list">
    {#each usersWithAccess as userWithAccess (userWithAccess.id)}
      <AccessControlRow
        {userProfile}
        {getUserRoles}
        userModel={userWithAccess}
        {accessControlObject}
        {removeAccessForUser}
      />
    {/each}
  </div>
</div>

<style lang="scss">
  .add-user {
    padding: var(--size-x-small);
    border: 1px solid var(--slate-300);
    border-radius: var(--border-radius-m);

    .add-user-form {
      display: grid;
      grid-template-columns: 4fr 3fr 1fr;
      grid-gap: 0.5rem;

      .placeholder {
        color: var(--slate-600);
      }

      .add-button {
        display: flex;
        flex-direction: column;
        align-items: center;
        justify-content: flex-end;
      }
    }
  }

  .users-with-access {
    margin-top: var(--size-large);

    .header {
      font-weight: 500;
    }
    .list {
      margin-top: var(--size-base);
      display: grid;
      grid-template-columns: 6fr 5fr 1fr 3rem;
      align-items: center;
      border: 1px solid var(--slate-200);
      border-radius: var(--border-radius-m);
      background: var(--white);
    }
  }
  .no-users {
    padding: var(--size-xx-small);
  }
</style>
