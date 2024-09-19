<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Role } from '@mathesar/models/Role';
  import type { ImmutableMap } from '@mathesar-component-library';

  import type { PermissionsMetaData } from '../permissionsUtils';

  import OverviewSection from './OverviewSection.svelte';
  import RoleWithChildren from './RoleWithChildren.svelte';

  type Privilege = $$Generic;

  export let roles: ImmutableMap<Role['oid'], Role>;
  export let permissionsMetaData: PermissionsMetaData<Privilege>;

  $: ownerOid = permissionsMetaData.ownerOid;
</script>

<OverviewSection title={$_('owner')}>
  <RoleWithChildren rolesMap={roles} roleOid={$ownerOid} />
</OverviewSection>
