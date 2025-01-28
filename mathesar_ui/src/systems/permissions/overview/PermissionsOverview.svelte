<script lang="ts">
  import type { ModalController } from '@mathesar-component-library';

  import type {
    PermissionsStoreValues,
    RolePrivileges,
  } from '../permissionsUtils';

  import AccessControl from './AccessControl.svelte';
  import type { AccessControlConfig } from './overviewUtils';
  import Owner from './Owner.svelte';

  type AccessLevel = $$Generic;
  type Privilege = $$Generic;

  export let controller: ModalController;
  export let accessControlConfig: AccessControlConfig<AccessLevel, Privilege>;
  export let savePrivilegesForRoles: (
    privileges: RolePrivileges<Privilege>[],
  ) => Promise<void>;

  export let storeValues: PermissionsStoreValues<Privilege>;
  $: ({ roles, privilegesForRoles, permissionsMetaData } = storeValues);
</script>

<div class="permissions-overview">
  <Owner {roles} {permissionsMetaData} />
  <AccessControl
    {controller}
    config={accessControlConfig}
    {roles}
    {privilegesForRoles}
    {permissionsMetaData}
    {savePrivilegesForRoles}
  />
</div>
