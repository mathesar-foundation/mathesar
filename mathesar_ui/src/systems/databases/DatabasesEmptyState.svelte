<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconAddNew, iconConnection } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { Button, Icon, Tutorial } from '@mathesar-component-library';

  import ConnectDatabaseModal from './create-database/ConnectDatabaseModal.svelte';

  const userProfileStore = getUserProfileStoreFromContext();
  $: ({ isMathesarAdmin } = $userProfileStore);

  const connectDatabaseModalController = modal.spawnModalController();
</script>

<div class="content" data-identifier="connection-empty-text">
  <Tutorial>
    <div slot="icon" data-identifier="connection-icon">
      <Icon {...iconConnection} size="var(--lg5)" />
    </div>
    <div slot="title">
      {$_('no_databases_connected')}
    </div>
    <div slot="body">
      <div data-identifier="no-connections-help">
        {$_('setup_connections_help')}
      </div>
    </div>
    <div slot="footer">
      {#if isMathesarAdmin}
        <Button
          appearance="primary"
          on:click={() => connectDatabaseModalController.open()}
        >
          <Icon {...iconAddNew} />
          <span>{$_('connect_database')}</span>
        </Button>
      {/if}
    </div>
  </Tutorial>
</div>

<ConnectDatabaseModal controller={connectDatabaseModalController} />

<style lang="scss">
  [data-identifier='connection-empty-text'] {
    text-align: center;
    --tutorial_padding: 3.5rem 1.5rem;

    [data-identifier='connection-icon'] {
      color: var(--text-color-secondary);
    }
    [data-identifier='no-connections-help'] {
      margin-top: var(--sm5);
    }
  }
</style>
