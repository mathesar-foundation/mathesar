<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import { DatabaseSettingsRouteContext } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import { iconDeleteMajor, iconEdit } from '@mathesar/icons';
  import type { Collaborator } from '@mathesar/models/Collaborator';
  import type { Database } from '@mathesar/models/Database';
  import { confirm } from '@mathesar/stores/confirmation';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { Button, SpinnerButton } from '@mathesar-component-library';

  import RemoveCollaboratorBody from './RemoveCollaboratorBody.svelte';
  import RemoveCollaboratorTitle from './RemoveCollaboratorTitle.svelte';

  export let collaborator: Collaborator;
  export let database: Pick<Database, 'displayName' | 'name'>;
  export let onClickEditRole: (collaborator: Collaborator) => void;
  export let onDelete: (collaborator: Collaborator) => void;

  const routeContext = DatabaseSettingsRouteContext.get();
  $: ({ configuredRoles, users } = $routeContext);

  const userProfileStore = getUserProfileStoreFromContext();
  $: ({ isMathesarAdmin } = $userProfileStore);

  $: user = $users.resolvedValue?.get(collaborator.userId);
  $: configuredRoleId = collaborator.configuredRoleId;
  $: configuredRole = $configuredRoles.resolvedValue?.get($configuredRoleId);
  $: userName = user ? user.full_name || user.username : '';

  async function deleteCollaborator() {
    await $routeContext.deleteCollaborator(collaborator);
    onDelete(collaborator);
    toast.success($_('collaborator_removed_successfully'));
  }
</script>

<GridTableCell>
  <div>
    {#if user}
      <div>{userName}</div>
      <div>{user.email ?? ''}</div>
    {:else}
      {collaborator.userId}
    {/if}
  </div>
</GridTableCell>
<GridTableCell>
  <div class="role-info">
    <div>
      {#if configuredRole}
        {configuredRole.name}
      {:else}
        {$configuredRoleId}
      {/if}
    </div>
    <div class="actions">
      <Button
        appearance="secondary"
        on:click={() => onClickEditRole(collaborator)}
        disabled={!isMathesarAdmin}
        tooltip={$_('change_role')}
      >
        <Icon {...iconEdit} size="0.8em" />
      </Button>
    </div>
  </div>
</GridTableCell>

<GridTableCell>
  <SpinnerButton
    appearance="outline-primary"
    confirm={() =>
      confirm({
        title: {
          component: RemoveCollaboratorTitle,
          props: {
            userName,
            databaseName: database.displayName,
          },
        },
        body: {
          component: RemoveCollaboratorBody,
          props: {
            userName,
            databaseName: database.displayName,
            roleName: configuredRole?.name,
          },
        },
        proceedButton: {
          label: $_('remove_collaborator'),
        },
      })}
    onClick={deleteCollaborator}
    icon={{ ...iconDeleteMajor, size: '0.8em' }}
    label=""
    tooltip={$_('remove_collaborator')}
    disabled={!isMathesarAdmin}
  />
</GridTableCell>

<style lang="scss">
  .role-info {
    display: flex;
    width: 100%;
    align-items: center;

    .actions {
      margin-left: auto;
    }
  }
</style>
