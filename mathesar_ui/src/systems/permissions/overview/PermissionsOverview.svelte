<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Errors from '@mathesar/components/Errors.svelte';
  import {
    ImmutableMap,
    type ModalController,
    Spinner,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import AccessControl from './AccessControl.svelte';
  import Owner from './Owner.svelte';
  import {
    type AccessControlConfig,
    type PermissionsAsyncStores,
    type RolePrivileges,
  } from './utils';

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
      {savePrivilegesForRoles}
    />
  {:else}
    <Errors {errors} fullWidth />
  {/if}
</div>
