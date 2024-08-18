<script lang="ts">
  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import { iconDeleteMajor, iconEdit } from '@mathesar/icons';
  import { Collaborator } from '@mathesar/models/Collaborator';
  import { Button } from '@mathesar-component-library';

  import { getDatabaseSettingsContext } from '../databaseSettingsUtils';

  export let collaborator: Collaborator;

  const databaseContext = getDatabaseSettingsContext();
  $: ({ configuredRoles, users } = $databaseContext);

  $: user = $users.resolvedValue?.get(collaborator.user_id);
  $: configuredRole = $configuredRoles.resolvedValue?.get(
    collaborator.configured_role_id,
  );
</script>

<GridTableCell>
  <div>
    {#if user}
      <div>{user.full_name || user.username}</div>
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
      <Button appearance="secondary">
        <Icon {...iconEdit} size="0.8em" />
      </Button>
    </div>
  </div>
</GridTableCell>
<GridTableCell>
  <Button appearance="secondary">
    <Icon {...iconDeleteMajor} size="0.8em" />
  </Button>
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
