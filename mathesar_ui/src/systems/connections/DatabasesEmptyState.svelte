<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconAddNew, iconConnection } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import { Button, Icon, Tutorial } from '@mathesar-component-library';

  // import AddConnectionModal from './AddConnectionModal.svelte';

  const addDatabaseModalController = modal.spawnModalController();
</script>

<div class="content" data-identifier="connection-empty-text">
  <Tutorial>
    <div slot="body">
      <div data-identifier="connection-icon">
        <Icon {...iconConnection} size="var(--size-super-ultra-large)" />
      </div>
      <div data-identifier="no-connections-text">
        {$_('no_database_connections_yet')}
      </div>
      <div data-identifier="no-connections-help">
        {$_('setup_connections_help')}
      </div>
    </div>
    <Button
      slot="footer"
      appearance="primary"
      on:click={() => addDatabaseModalController.open()}
    >
      <Icon {...iconAddNew} />
      <span>{$_('add_database_connection')}</span>
    </Button>
  </Tutorial>
</div>

<!-- <AddConnectionModal controller={addDatabaseModalController} /> -->

<style lang="scss">
  [data-identifier='connection-empty-text'] {
    text-align: center;

    [data-identifier='connection-icon'] {
      color: var(--sand-800);
    }
    [data-identifier='no-connections-text'] {
      font-size: var(--size-large);
      font-weight: 500;
      margin-top: var(--size-base);
    }
    [data-identifier='no-connections-help'] {
      margin-top: var(--size-super-ultra-small);
    }
  }
</style>
