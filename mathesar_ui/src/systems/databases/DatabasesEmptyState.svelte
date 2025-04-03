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
    <div slot="body">
      <div data-identifier="connection-icon">
        <Icon {...iconConnection} size="var(--size-super-ultra-large)" />
      </div>
      <div data-identifier="no-connections-text">
        {$_('no_databases_connected')}
      </div>
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
      color: var(--stormy-800);
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
