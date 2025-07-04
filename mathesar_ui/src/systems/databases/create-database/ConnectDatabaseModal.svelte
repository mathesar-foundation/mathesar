<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconAddNew, iconConnection } from '@mathesar/icons';
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

  function handleSuccess() {
    controller.close();
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
        icon={iconAddNew}
        header={$_('create_new_database')}
        description={$_('create_database_mathesar_internal_server')}
        changeView={() => setView('create')}
      />
      <ConnectOption
        icon={iconConnection}
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
    grid-gap: var(--sm3);
  }
</style>
