<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Errors from '@mathesar/components/errors/Errors.svelte';
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
  $: ({ roles, privilegesForRoles, permissionsMetaData, currentRole } =
    asyncStores);

  $: isLoading =
    $roles.isLoading ||
    $privilegesForRoles.isLoading ||
    $permissionsMetaData.isLoading ||
    $currentRole.isLoading;
  $: isSuccess =
    $roles.isOk &&
    $privilegesForRoles.isOk &&
    $permissionsMetaData.isOk &&
    $currentRole.isOk;
  $: errors = [
    $roles.error,
    $privilegesForRoles.error,
    $permissionsMetaData.error,
    $currentRole.error,
  ].filter(isDefinedNonNullable);

  $: rolesValue = new ImmutableMap($roles.resolvedValue);
  $: permissionsMetaDataValue = $permissionsMetaData.resolvedValue;
  $: privilegesForRolesValue = new ImmutableMap(
    $privilegesForRoles.resolvedValue,
  );
  $: currentRoleValue = $currentRole.resolvedValue;
  $: storeValues =
    isSuccess && permissionsMetaDataValue && currentRoleValue
      ? {
          roles: rolesValue,
          permissionsMetaData: permissionsMetaDataValue,
          privilegesForRoles: privilegesForRolesValue,
          currentRole: currentRoleValue,
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
  $: currentRoleOwns =
    $permissionsMetaData.resolvedValue?.currentAccess.currentRoleOwns;
  $: displayedTabs = $currentRoleOwns
    ? tabs
    : tabs.filter((t) => t.for === 'all');
</script>

<div class="content">
  {#if isLoading}
    <Spinner />
  {:else if isSuccess && storeValues}
    <div class="tabs" class:tabs-displayed={displayedTabs.length > 1}>
      <TabContainer
        tabs={displayedTabs}
        uniformTabWidth={false}
        tabStyle="compact"
        hideTabsInCaseOfSingleTab={true}
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
    --Tab_margin-right: var(--sm1);

    &.tabs-displayed {
      .tab-content {
        margin-top: 1rem;
      }
    }
  }
</style>
