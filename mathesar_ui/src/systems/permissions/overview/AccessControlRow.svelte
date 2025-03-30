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

  import type { PermissionsMetaData } from '../permissionsUtils';

  import {
    type RoleAccessLevelAndPrivileges,
    customAccess,
  } from './RoleAccessLevelAndPrivileges';
  import RoleWithChildren from './RoleWithChildren.svelte';

  type AccessLevel = $$Generic;
  type Privilege = $$Generic;

  export let rolesMap: ImmutableMap<Role['oid'], Role>;
  export let permissionsMetaData: PermissionsMetaData<Privilege>;

  export let accessLevelsInfoMap: Map<
    AccessLevel | typeof customAccess,
    {
      id: AccessLevel | typeof customAccess;
      name: string;
      help: string;
    }
  >;
  export let privilegeInfoMap: Map<
    Privilege,
    {
      id: Privilege;
      help: string;
    }
  >;
  export let roleAccess: RoleAccessLevelAndPrivileges<AccessLevel, Privilege>;

  export let setAccess: (
    roleOid: Role['oid'],
    access: RoleAccessLevelAndPrivileges<AccessLevel, Privilege>,
  ) => void;
  export let removeAccess: (roleOid: Role['oid']) => void;

  let isRolePermissionsOpen = false;

  $: currentRoleOwns = permissionsMetaData.currentAccess.currentRoleOwns;

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
    {#if $currentRoleOwns}
      <Select
        options={[...accessLevelsInfoMap.keys()]}
        value={roleAccess.accessLevel}
        on:change={(e) => changeAccess(e.detail)}
        let:option
      >
        <div slot="trigger">
          {accessLevelsInfoMap.get(option)?.name ?? ''}
        </div>
        {#if option}
          <div class="access-selection-option">
            <div class="name">
              {accessLevelsInfoMap.get(option)?.name ?? ''}
            </div>
            <div class="help">
              {accessLevelsInfoMap.get(option)?.help ?? ''}
            </div>
          </div>
        {/if}
      </Select>
    {:else}
      <div class="access-level-static">
        {accessLevelsInfoMap.get(roleAccess.accessLevel)?.name ?? ''}
      </div>
    {/if}
  </div>
  {#if $currentRoleOwns}
    <div>
      <Button
        appearance="secondary"
        on:click={() => removeAccess(roleAccess.roleOid)}
      >
        <Icon {...iconDeleteMinor} />
      </Button>
    </div>
  {/if}
</div>
{#if roleAccess.accessLevel === customAccess}
  <div class="role-permissions">
    <Collapsible bind:isOpen={isRolePermissionsOpen} triggerAppearance="plain">
      <div slot="header">
        {$_('role_privileges')}
      </div>
      <div class="content" slot="content">
        <CheckboxGroup
          values={roleAccess.privileges.valuesArray()}
          on:artificialChange={(e) => setCustomPrivileges(e.detail)}
          options={[...privilegeInfoMap.keys()]}
          getCheckboxLabel={(o) => String(o)}
          getCheckboxHelp={(o) => privilegeInfoMap.get(o)?.help ?? ''}
          disabled={!$currentRoleOwns}
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
  .access-selection-option {
    .name {
      font-weight: 500;
    }
    .help {
      margin-top: var(--size-extreme-small);
      font-size: var(--text-size-small);
      white-space: normal;
      max-width: 15rem;
    }
  }
  .access-level-static {
    text-align: right;
    font-weight: 500;
  }
  .role-permissions {
    margin-top: var(--size-xx-small);
    --Collapsible_trigger-padding: var(--size-extreme-small) 0;
    --Collapsible_header-font-weight: 400;

    .content {
      margin-top: var(--size-super-ultra-small);
      padding: var(--size-x-small);
      border: 1px solid var(--border-color);
      border-radius: var(--border-radius-l);
      background: var(--background-color);
    }
  }
</style>
