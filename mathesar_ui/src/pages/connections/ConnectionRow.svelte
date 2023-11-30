<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { Icon, Button } from '@mathesar-component-library';
  import { iconEdit, iconDeleteMajor } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import {
    EditConnectionModal,
    DeleteConnectionModal,
  } from '@mathesar/systems/connections';
  import type { Connection } from '@mathesar/api/connections';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import { iconConnection } from '@mathesar/icons';

  const editConnectionModalController = modal.spawnModalController();
  const deleteConnectionModalController = modal.spawnModalController();

  export let connection: Connection;
</script>

<div data-identifier="connection-row" class="grid-row">
  <span>
    <a href={getDatabasePageUrl(connection.nickname)}>
      <Icon {...iconConnection} />
      {connection.nickname}
    </a>
  </span>
  <span>{connection.database}</span>
  <span>{connection.username}</span>
  <span>{connection.host}</span>
  <span>{connection.port}</span>
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
</div>

<EditConnectionModal controller={editConnectionModalController} {connection} />
<DeleteConnectionModal
  controller={deleteConnectionModalController}
  {connection}
/>

<style lang="scss">
  [data-identifier='connection-row'] {
    display: contents;

    > * {
      padding: var(--size-large);
      display: flex;
      align-items: center;
    }

    .actions > :global(* + *) {
      margin-left: var(--size-xx-small);
    }
  }
</style>
