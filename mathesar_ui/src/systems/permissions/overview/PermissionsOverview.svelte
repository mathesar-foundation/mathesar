<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Errors from '@mathesar/components/Errors.svelte';
  import {
    ImmutableMap,
    type ModalController,
    Spinner,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type {
    PermissionsAsyncStores,
    RolePrivileges,
  } from '../permissionsUtils';

  import AccessControl from './AccessControl.svelte';
  import type { AccessControlConfig } from './overviewUtils';
  import Owner from './Owner.svelte';

  type AccessLevel = $$Generic;
  type Privilege = $$Generic;

  export let controller: ModalController;
  export let accessControlConfig: AccessControlConfig<AccessLevel, Privilege>;
  export let getAsyncStores: () => PermissionsAsyncStores<Privilege>;
  export let savePrivilegesForRoles: (
    privileges: RolePrivileges<Privilege>[],
  ) => Promise<void>;

  $: ({ roles, privilegesForRoles, permissionsMetaData } = getAsyncStores());

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
</script>

<div class="permissions-overview">
  {#if isLoading}
    <Spinner />
  {:else if isSuccess && permissionsMetaDataValue}
    <Owner roles={rolesValue} permissionsMetaData={permissionsMetaDataValue} />
    <AccessControl
      {controller}
      config={accessControlConfig}
      roles={rolesValue}
      privilegesForRoles={privilegesForRolesValue}
      permissionsMetaData={permissionsMetaDataValue}
      {savePrivilegesForRoles}
    />
  {:else}
    <Errors {errors} fullWidth />
  {/if}
</div>
