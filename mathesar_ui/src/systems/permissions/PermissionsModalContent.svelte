<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Errors from '@mathesar/components/Errors.svelte';
  import {
    ImmutableMap,
    Spinner,
    TabContainer,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type {
    PermissionsAsyncStores,
    PermissionsModalSlots,
  } from './permissionsUtils';

  type Privilege = $$Generic;
  type $$Slots = PermissionsModalSlots<Privilege>;

  export let getAsyncStores: () => PermissionsAsyncStores<Privilege>;

  $: asyncStores = getAsyncStores();
  $: ({ roles, privilegesForRoles, permissionsMetaData } = asyncStores);

  $: isLoading =
    $roles.isLoading ||
    $privilegesForRoles.isLoading ||
    $permissionsMetaData.isLoading;
  $: isSuccess =
    $roles.isOk && $privilegesForRoles.isOk && $permissionsMetaData.isOk;
  $: errors = [
    $roles.error,
    $privilegesForRoles.error,
    $permissionsMetaData.error,
  ].filter((entry): entry is string => isDefinedNonNullable(entry));

  $: rolesValue = new ImmutableMap($roles.resolvedValue);
  $: permissionsMetaDataValue = $permissionsMetaData.resolvedValue;
  $: privilegesForRolesValue = new ImmutableMap(
    $privilegesForRoles.resolvedValue,
  );
  $: storeValues =
    isSuccess && permissionsMetaDataValue
      ? {
          roles: rolesValue,
          permissionsMetaData: permissionsMetaDataValue,
          privilegesForRoles: privilegesForRolesValue,
        }
      : undefined;

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
  {#if isLoading}
    <Spinner />
  {:else if isSuccess && storeValues}
    <div class="tabs">
      <TabContainer
        tabs={displayedTabs}
        uniformTabWidth={false}
        tabStyle="compact"
        let:activeTab
      >
        <div class="tab-content">
          {#if activeTab?.id === 'share'}
            <slot name="share" {storeValues} />
          {:else if activeTab?.id === 'transfer_ownership'}
            <slot name="transfer-ownership" {storeValues} />
          {/if}
        </div>
      </TabContainer>
    </div>
  {:else}
    <Errors {errors} fullWidth />
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
