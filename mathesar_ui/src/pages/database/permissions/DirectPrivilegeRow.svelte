<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { type RawDatabasePrivilegesForRole } from '@mathesar/api/rpc/databases';
  import { iconDeleteMinor } from '@mathesar/icons';
  import type { Role } from '@mathesar/models/Role';
  import {
    Button,
    CheckboxGroup,
    Collapsible,
    Icon,
    type ImmutableMap,
    ImmutableSet,
    Select,
  } from '@mathesar-component-library';

  export let rolesMap: ImmutableMap<Role['oid'], Role>;
  export let dbPrivilegeForRole: RawDatabasePrivilegesForRole;

  let isRolePermissionsOpen = false;

  const accessLevels = ['connect', 'connect_and_create', 'custom'] as const;
  type AccessLevel = (typeof accessLevels)[number];
  let access: AccessLevel;

  $: directAccessLevelSet = new ImmutableSet(dbPrivilegeForRole.direct);
  $: access = (() => {
    if (directAccessLevelSet.equals(new Set(['CONNECT', 'CREATE']))) {
      return 'connect_and_create';
    }
    if (directAccessLevelSet.equals(new Set(['CONNECT']))) {
      return 'connect';
    }
    return 'custom';
  })();

  $: role = rolesMap.get(dbPrivilegeForRole.role_oid);
  $: members = role?.members;

  function changeAccess(option?: AccessLevel) {
    if (option) {
      if (option === 'custom') {
        isRolePermissionsOpen = true;
      }
    }
  }

  function permissionChange(e: unknown) {
    console.log(e);
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
      options={accessLevels}
      bind:value={access}
      on:change={(e) => changeAccess(e.detail)}
    />
  </div>
  <div>
    <Button appearance="secondary">
      <Icon {...iconDeleteMinor} />
    </Button>
  </div>
</div>
{#if access === 'custom'}
  <div class="role-permissions-section">
    <Collapsible bind:isOpen={isRolePermissionsOpen} triggerAppearance="plain">
      <div slot="header">
        {$_('role_permissions')}
      </div>
      <div class="content" slot="content">
        <CheckboxGroup
          values={dbPrivilegeForRole.direct}
          on:change={(e) => permissionChange(e)}
          options={['CONNECT', 'CREATE']}
          getCheckboxLabel={(o) => o}
          getCheckboxHelp={(o) => o}
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

    .content {
      margin-top: var(--size-super-ultra-small);
      padding: var(--size-x-small);
      border: 1px solid var(--slate-200);
      border-radius: var(--border-radius-l);
      background: var(--white);
    }
  }
</style>
