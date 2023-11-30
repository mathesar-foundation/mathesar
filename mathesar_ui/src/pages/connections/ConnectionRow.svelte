<script lang="ts">
  import { _ } from 'svelte-i18n';
  import type { Database } from '@mathesar/AppTypes';
  import { Icon, Button } from '@mathesar-component-library';
  import { iconEdit, iconDeleteMajor } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import { EditConnectionModal } from '@mathesar/systems/connections';

  const editConnectionModalController = modal.spawnModalController();

  export let connection: Database;
</script>

<div data-identifier="connection-row" class="grid-row">
  <span>{connection.nickname}</span>
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
    <Button appearance="outline-primary">
      <Icon {...iconDeleteMajor} />
      <span>{$_('delete')}</span>
    </Button>
  </div>
</div>

<EditConnectionModal controller={editConnectionModalController} {connection} />

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
