<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import { iconDeleteMajor, iconEdit } from '@mathesar/icons';
  import type { Collaborator } from '@mathesar/models/Collaborator';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { Button, SpinnerButton } from '@mathesar-component-library';

  import { getDatabaseSettingsContext } from '../databaseSettingsUtils';

  export let collaborator: Collaborator;
  export let editRoleForCollaborator: (collaborator: Collaborator) => void;

  const databaseContext = getDatabaseSettingsContext();
  $: ({ configuredRoles, users } = $databaseContext);

  $: user = $users.resolvedValue?.get(collaborator.user_id);
  $: configuredRole = $configuredRoles.resolvedValue?.get(
    collaborator.configured_role_id,
  );
  $: userName = user ? user.full_name || user.username : '';
</script>

<GridTableCell>
  <div>
    {#if user}
      <div>{userName}</div>
      <div>{user.email}</div>
    {:else}
      {collaborator.user_id}
    {/if}
  </div>
</GridTableCell>
<GridTableCell>
  <div class="role-info">
    <div>
      {#if configuredRole}
        {configuredRole.name}
      {:else}
        {collaborator.configured_role_id}
      {/if}
    </div>
    <div class="actions">
      <Button
        appearance="secondary"
        on:click={() => editRoleForCollaborator(collaborator)}
      >
        <Icon {...iconEdit} size="0.8em" />
      </Button>
    </div>
  </div>
</GridTableCell>
<GridTableCell>
  <SpinnerButton
    confirm={() =>
      confirmDelete({
        identifierName: userName,
        identifierType: $_('collaborator'),
      })}
    onClick={() => $databaseContext.deleteCollaborator(collaborator)}
    icon={{ ...iconDeleteMajor, size: '0.8em' }}
    label=""
    appearance="secondary"
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
