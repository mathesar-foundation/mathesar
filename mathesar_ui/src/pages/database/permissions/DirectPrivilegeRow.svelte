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

  import { type RoleAccessLevelAndPrivileges, customAccess } from './utils';

  type AccessLevel = $$Generic;
  type Privilege = $$Generic;

  export let rolesMap: ImmutableMap<Role['oid'], Role>;
  export let privileges: Privilege[];
  export let accessLevels: { id: AccessLevel; privileges: Set<Privilege> }[];

  export let roleAccessLevelAndPrivileges: RoleAccessLevelAndPrivileges<
    AccessLevel,
    Privilege
  >;
  export let setRoleAccessLevelAndPrivileges: (
    roleOid: Role['oid'],
    accessLevelPrivileges: RoleAccessLevelAndPrivileges<AccessLevel, Privilege>,
  ) => void;

  let isRolePermissionsOpen = false;

  $: role = rolesMap.get(roleAccessLevelAndPrivileges.roleOid);
  $: members = role?.members;

  function removeAccess() {
    setRoleAccessLevelAndPrivileges(
      roleAccessLevelAndPrivileges.roleOid,
      roleAccessLevelAndPrivileges.withAccessRemoved(),
    );
  }

  function setCustomPrivileges(pr: Privilege[]) {
    setRoleAccessLevelAndPrivileges(
      roleAccessLevelAndPrivileges.roleOid,
      roleAccessLevelAndPrivileges.withCustomAccess(pr),
    );
  }

  function changeAccess(option?: AccessLevel | typeof customAccess) {
    switch (option) {
      case customAccess:
        setRoleAccessLevelAndPrivileges(
          roleAccessLevelAndPrivileges.roleOid,
          roleAccessLevelAndPrivileges.withCustomAccess(),
        );
        isRolePermissionsOpen = true;
        break;
      case undefined:
        removeAccess();
        break;
      default:
        setRoleAccessLevelAndPrivileges(
          roleAccessLevelAndPrivileges.roleOid,
          roleAccessLevelAndPrivileges.withAccess(option),
        );
    }
  }
</script>

<div class="access-selection-section">
  <div class="name-and-members">
    {#if role}
      <div class="name">
        <span>{role.name}</span>
      </div>
      <div>
        {#if $members?.size}
          + {$members.size}
        {/if}
      </div>
    {/if}
  </div>
  <div>
    <Select
      options={[...accessLevels.map((entry) => entry.id), customAccess]}
      value={roleAccessLevelAndPrivileges.accessLevel}
      on:change={(e) => changeAccess(e.detail)}
    />
  </div>
  <div>
    <Button appearance="secondary" on:click={removeAccess}>
      <Icon {...iconDeleteMinor} />
    </Button>
  </div>
</div>
{#if roleAccessLevelAndPrivileges.accessLevel === customAccess}
  <div class="role-permissions-section">
    <Collapsible bind:isOpen={isRolePermissionsOpen} triggerAppearance="plain">
      <div slot="header">
        {$_('role_permissions')}
      </div>
      <div class="content" slot="content">
        <CheckboxGroup
          values={roleAccessLevelAndPrivileges.privileges.valuesArray()}
          on:artificialChange={(e) => setCustomPrivileges(e.detail)}
          options={privileges}
          getCheckboxLabel={(o) => String(o)}
          getCheckboxHelp={(o) => String(o)}
        />
      </div>
    </Collapsible>
  </div>
{/if}

<style lang="scss">
  .access-selection-section {
    display: grid;
    grid-template-columns: 2fr 1fr auto;
    gap: var(--size-ultra-small);

    .name-and-members {
      .name {
        span {
          padding: var(--size-extreme-small) var(--size-xx-small);
          background: var(--slate-100);
          border-radius: var(--border-radius-xl);
          font-weight: 500;
        }
      }
    }
  }
  .role-permissions-section {
    margin-top: var(--size-super-ultra-small);
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
