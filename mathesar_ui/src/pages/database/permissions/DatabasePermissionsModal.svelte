<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import {
    ControlledModal,
    type ModalController,
    TabContainer,
  } from '@mathesar-component-library';

  import PrivilegesSection from './PrivilegesSection.svelte';
  import TransferOwnershipSection from './TransferOwnershipSection.svelte';

  export let controller: ModalController;

  const databaseContext = DatabaseRouteContext.get();
  $: ({ database } = $databaseContext);
  $: databasePrivileges = database.constructDatabasePrivilegesStore();

  const tabs = [
    {
      id: 'share',
      label: $_('share'),
    },
    {
      id: 'transfer_ownership',
      label: $_('transfer_ownership'),
    },
  ];
  let activeTab = tabs[0];

  function onModalClose() {
    [activeTab] = tabs;
  }
</script>

<ControlledModal {controller} on:close={onModalClose}>
  <span slot="title">
    {$_('database_permissions')}
  </span>
  <div class="tabs">
    <TabContainer
      bind:activeTab
      {tabs}
      uniformTabWidth={false}
      tabStyle="compact"
    >
      <div class="tab-content">
        {#if activeTab.id === 'share'}
          <PrivilegesSection {controller} {databasePrivileges} />
        {:else}
          <TransferOwnershipSection {controller} />
        {/if}
      </div>
    </TabContainer>
  </div>
</ControlledModal>

<style lang="scss">
  .tabs {
    --Tab_margin-right: var(--size-small);
  }
</style>
