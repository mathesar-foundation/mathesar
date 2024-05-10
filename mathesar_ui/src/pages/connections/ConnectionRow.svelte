<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Connection } from '@mathesar/api/rest/connections';
  import { iconDeleteMajor, iconEdit } from '@mathesar/icons';
  import { iconConnection } from '@mathesar/icons';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    DeleteConnectionModal,
    EditConnectionModal,
  } from '@mathesar/systems/connections';
  import { Button, Icon } from '@mathesar-component-library';

  const userProfileStore = getUserProfileStoreFromContext();
  $: userProfile = $userProfileStore;
  $: isSuperUser = userProfile?.isSuperUser;

  const editConnectionModalController = modal.spawnModalController();
  const deleteConnectionModalController = modal.spawnModalController();

  export let connection: Connection;
</script>

<tr data-identifier="connection-row" class="grid-row">
  <td>
    <a href={getDatabasePageUrl(connection.id)}>
      <Icon {...iconConnection} />
      {connection.nickname}
    </a>
  </td>
  <td>{connection.database}</td>
  <td>{connection.username}</td>
  <td>{connection.host}</td>
  <td>{connection.port}</td>
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

<EditConnectionModal controller={editConnectionModalController} {connection} />
<DeleteConnectionModal
  controller={deleteConnectionModalController}
  {connection}
/>

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
