<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Errors from '@mathesar/components/Errors.svelte';
  import { Spinner, TabContainer } from '@mathesar-component-library';

  import type { PermissionsAsyncStores } from './permissionsUtils';

  type Privilege = $$Generic;

  export let getAsyncStores: () => PermissionsAsyncStores<Privilege>;

  $: asyncStores = getAsyncStores();
  $: ({ permissionsMetaData } = asyncStores);

  const tabs = [
    {
      id: 'share',
      label: $_('share'),
      for: 'all',
    },
    {
      id: 'transfer_ownership',
      label: $_('transfer_ownership'),
      for: 'owner',
    },
  ];
  $: displayedTabs = $permissionsMetaData.resolvedValue?.current_role_owns
    ? tabs
    : tabs.filter((t) => t.for === 'all');
</script>

<div class="content">
  {#if $permissionsMetaData.isLoading}
    <Spinner />
  {:else if $permissionsMetaData.resolvedValue}
    <div class="tabs">
      <TabContainer
        tabs={displayedTabs}
        uniformTabWidth={false}
        tabStyle="compact"
        let:activeTab
      >
        <div class="tab-content">
          {#if activeTab?.id === 'share'}
            <slot name="share" {asyncStores} />
          {:else if activeTab?.id === 'transfer_ownership'}
            <slot name="transfer-ownership" {asyncStores} />
          {/if}
        </div>
      </TabContainer>
    </div>
  {:else if $permissionsMetaData.error}
    <Errors errors={[$permissionsMetaData.error]} fullWidth />
  {/if}
</div>

<style lang="scss">
  .tabs {
    --Tab_margin-right: var(--size-small);

    .tab-content {
      margin-top: var(--size-base);
    }
  }
</style>
