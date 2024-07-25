<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database } from '@mathesar/api/rpc/databases';
  import { iconDeleteMajor, iconEdit } from '@mathesar/icons';
  import { iconConnection } from '@mathesar/icons';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { Button, Icon } from '@mathesar-component-library';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;
  $: isSuperUser = userProfile?.isSuperUser;

  const editConnectionModalController = modal.spawnModalController();
  const deleteConnectionModalController = modal.spawnModalController();

  export let database: Database;
</script>

<tr data-identifier="connection-row" class="grid-row">
  <td>
    <a href={getDatabasePageUrl(database.id)}>
      <Icon {...iconConnection} />
      {database.name}
    </a>
  </td>
  {#if isSuperUser}
    <td>
      <div class="actions">
        <Button
          appearance="secondary"
          on:click={() => editConnectionModalController.open()}
        >
          <Icon {...iconEdit} />
          <span>{$_('edit')}</span>
        </Button>
        <Button
          appearance="outline-primary"
          on:click={() => deleteConnectionModalController.open()}
        >
          <Icon {...iconDeleteMajor} />
          <span>{$_('delete')}</span>
        </Button>
      </div>
    </td>
  {/if}
</tr>

<!-- <EditConnectionModal controller={editConnectionModalController} {connection} />
<DeleteConnectionModal
  controller={deleteConnectionModalController}
  {connection}
/> -->

<style lang="scss">
  [data-identifier='connection-row'] {
    td {
      padding: var(--size-base);
    }

    .actions {
      display: flex;
      align-items: center;
      gap: var(--size-xx-small);
    }
  }
</style>
