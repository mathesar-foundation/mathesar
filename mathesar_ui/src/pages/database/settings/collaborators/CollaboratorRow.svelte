<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import { DatabaseSettingsRouteContext } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import { iconDeleteMajor, iconEdit } from '@mathesar/icons';
  import type { Collaborator } from '@mathesar/models/Collaborator';
  import { confirmDelete } from '@mathesar/stores/confirmation';
  import { Button, SpinnerButton } from '@mathesar-component-library';

  export let collaborator: Collaborator;
  export let editRoleForCollaborator: (collaborator: Collaborator) => void;

  const routeContext = DatabaseSettingsRouteContext.get();
  $: ({ configuredRoles, users } = $routeContext);

  $: user = $users.resolvedValue?.get(collaborator.userId);
  $: configuredRoleId = collaborator.configuredRoleId;
  $: configuredRole = $configuredRoles.resolvedValue?.get($configuredRoleId);
  $: userName = user ? user.full_name || user.username : '';
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
    onClick={() => $routeContext.deleteCollaborator(collaborator)}
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
