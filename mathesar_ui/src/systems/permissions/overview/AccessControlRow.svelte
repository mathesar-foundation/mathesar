<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconDeleteMinor } from '@mathesar/icons';
  import type { Role } from '@mathesar/models/Role';
  import {
    Button,
    CheckboxGroup,
    Collapsible,
    Icon,
    type ImmutableMap,
    Select,
  } from '@mathesar-component-library';

  import {
    type RoleAccessLevelAndPrivileges,
    customAccess,
  } from './RoleAccessLevelAndPrivileges';
  import RoleWithChildren from './RoleWithChildren.svelte';
  import type { AccessControlConfig } from './utils';

  type AccessLevel = $$Generic;
  type Privilege = $$Generic;

  export let rolesMap: ImmutableMap<Role['oid'], Role>;
  export let config: AccessControlConfig<AccessLevel, Privilege>;
  export let roleAccess: RoleAccessLevelAndPrivileges<AccessLevel, Privilege>;

  export let setAccess: (
    roleOid: Role['oid'],
    access: RoleAccessLevelAndPrivileges<AccessLevel, Privilege>,
  ) => void;
  export let removeAccess: (roleOid: Role['oid']) => void;

  let isRolePermissionsOpen = false;

  function setCustomPrivileges(pr: Privilege[]) {
    setAccess(roleAccess.roleOid, roleAccess.withCustomAccess(pr));
  }

  function changeAccess(option?: AccessLevel | typeof customAccess) {
    if (option) {
      if (option === customAccess) {
        setAccess(roleAccess.roleOid, roleAccess.withCustomAccess());
        isRolePermissionsOpen = true;
      } else {
        setAccess(roleAccess.roleOid, roleAccess.withAccess(option));
      }
    }
  }
</script>

<div class="access-selection">
  <RoleWithChildren {rolesMap} roleOid={roleAccess.roleOid} />
  <div>
    <Select
      options={[...config.access.levels.map((entry) => entry.id), customAccess]}
      value={roleAccess.accessLevel}
      on:change={(e) => changeAccess(e.detail)}
    />
  </div>
  <div>
    <Button
      appearance="secondary"
      on:click={() => removeAccess(roleAccess.roleOid)}
    >
      <Icon {...iconDeleteMinor} />
    </Button>
  </div>
</div>
{#if roleAccess.accessLevel === customAccess}
  <div class="role-permissions">
    <Collapsible bind:isOpen={isRolePermissionsOpen} triggerAppearance="plain">
      <div slot="header">
        {$_('role_permissions')}
      </div>
      <div class="content" slot="content">
        <CheckboxGroup
          values={roleAccess.privileges.valuesArray()}
          on:artificialChange={(e) => setCustomPrivileges(e.detail)}
          options={config.allPrivileges}
          getCheckboxLabel={(o) => String(o)}
          getCheckboxHelp={(o) => String(o)}
        />
      </div>
    </Collapsible>
  </div>
{/if}

<style lang="scss">
  .access-selection {
    display: grid;
    grid-template-columns: 2fr 1fr auto;
    gap: var(--size-ultra-small);
  }
  .role-permissions {
    margin-top: var(--size-xx-small);
    --Collapsible_trigger-padding: var(--size-extreme-small) 0;
    --Collapsible_header-font-weight: 400;

    .content {
      margin-top: var(--size-super-ultra-small);
      padding: var(--size-x-small);
      border: 1px solid var(--slate-200);
      border-radius: var(--border-radius-l);
      background: var(--white);
    }
  }
</style>
