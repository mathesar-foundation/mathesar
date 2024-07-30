<script lang="ts">
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import type { Database } from '@mathesar/api/rpc/databases';
  import { iconConnectDatabase, iconCreateDatabase } from '@mathesar/icons';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import ConnectExistingDatabase from './ConnectExistingDatabase.svelte';
  import ConnectOption from './ConnectOption.svelte';
  import CreateNewDatabase from './CreateNewDatabase.svelte';

  export let controller: ModalController;

  type View = 'base' | 'create' | 'connect';
  let view: View = 'base';

  $: title = (() => {
    switch (view) {
      case 'create':
        return $_('create_new_database');
      case 'connect':
        return $_('connect_existing_database');
      case 'base':
      default:
        return $_('how_would_you_like_to_connect_db');
    }
  })();

  function setView(_view: View) {
    view = _view;
  }

  function handleCancel() {
    controller.close();
  }

  function handleSuccess(database: Database) {
    controller.close();
    const url = getDatabasePageUrl(database.id);
    router.goto(url);
  }
</script>

<ControlledModal
  {controller}
  size="medium"
  {title}
  on:close={() => setView('base')}
>
  {#if view === 'base'}
    <div class="connect-db-options">
      <ConnectOption
        icon={iconCreateDatabase}
        header={$_('create_new_database')}
        description={$_('create_database_mathesar_internal_server')}
        changeView={() => setView('create')}
      />
      <ConnectOption
        icon={iconConnectDatabase}
        header={$_('connect_existing_database')}
        description={$_('provide_details_connect_existing_database')}
        changeView={() => setView('connect')}
      />
    </div>
  {:else if view === 'create'}
    <CreateNewDatabase onCancel={handleCancel} onSuccess={handleSuccess} />
  {:else}
    <ConnectExistingDatabase
      onCancel={handleCancel}
      onSuccess={handleSuccess}
    />
  {/if}
</ControlledModal>

<style lang="scss">
  div.connect-db-options {
    display: grid;
    grid-gap: var(--size-xx-small);

    > :global(.btn.option) {
      display: grid;
      width: 100%;
      text-align: left;
      grid-template-columns: 100px 1fr;
      padding: var(--size-ultra-large) var(--size-large);
    }
  }
</style>
