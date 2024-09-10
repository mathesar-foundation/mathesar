<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    ControlledModal,
    type ModalController,
    TabContainer,
  } from '@mathesar-component-library';

  export let controller: ModalController;
  export let onClose: () => void = () => {};

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
    onClose();
  }
</script>

<ControlledModal {controller} on:close={onModalClose}>
  <slot name="title" slot="title" />
  <div class="tabs">
    <TabContainer
      bind:activeTab
      {tabs}
      uniformTabWidth={false}
      tabStyle="compact"
    >
      <div class="tab-content">
        {#if activeTab.id === 'share'}
          <slot name="privileges" {controller} />
        {:else}
          <slot name="transfer-ownership" {controller} />
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
