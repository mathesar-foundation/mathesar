<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import type { Role } from '@mathesar/models/Role';
  import {
    ButtonMenuItem,
    DropdownMenu,
    type ImmutableMap,
    type ModalController,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import AccessControlRow from './AccessControlRow.svelte';
  import OverviewSection from './OverviewSection.svelte';
  import {
    RoleAccessLevelAndPrivileges,
    customAccess,
  } from './RoleAccessLevelAndPrivileges';
  import {
    type AccessControlConfig,
    type PermissionsMetaData,
    type RolePrivileges,
    getObjectAccessPrivilegeMap,
  } from './utils';

  type AccessLevel = $$Generic;
  type Privilege = $$Generic;

  export let controller: ModalController;
  export let config: AccessControlConfig<AccessLevel, Privilege>;
  export let roles: ImmutableMap<Role['oid'], Role>;
  export let privilegesForRoles: ImmutableMap<
    number,
    RolePrivileges<Privilege>
  >;
  export let permissionsMetaData: PermissionsMetaData<Privilege>;

  export let savePrivilegesForRoles: (
    rp: RolePrivileges<Privilege>[],
  ) => Promise<void>;

  $: modifiablePrivileges = privilegesForRoles.filterValues(
    (pr) => pr.role_oid !== permissionsMetaData.owner_oid,
  );
  $: roleAccessField = requiredField(
    getObjectAccessPrivilegeMap(config.access.levels, modifiablePrivileges),
  );
  $: form = makeForm({ roleAccessField });

  $: accessLevelsInfoWithCustom = [
    ...config.access.levels.map((aL) => ({
      id: aL.id,
      name: aL.name,
      help: aL.help,
    })),
    {
      id: customAccess,
      name: $_('custom'),
      help: $_('access_custom_help'),
    },
  ];
  $: accessLevelsInfoMap = new Map(
    accessLevelsInfoWithCustom.map((e) => [e.id, e]),
  );
  $: privilegeInfoMap = new Map(config.allPrivileges.map((pr) => [pr.id, pr]));

  function addAccess(roleOid: Role['oid']) {
    const newRalp = new RoleAccessLevelAndPrivileges({
      roleOid,
      accessLevelConfig: config.access.levels,
      accessLevel: config.access.default,
    });
    roleAccessField.update((dbPrivMap) =>
      dbPrivMap.with(
        roleOid,
        newRalp,
        (existingRalp, _newRalp) => existingRalp ?? _newRalp,
      ),
    );
  }

  function setAccess(
    roleOid: Role['oid'],
    accessLevelPrivileges: RoleAccessLevelAndPrivileges<AccessLevel, Privilege>,
  ) {
    roleAccessField.update((dbPrivMap) =>
      dbPrivMap.with(roleOid, accessLevelPrivileges),
    );
  }

  function removeAccess(roleOid: Role['oid']) {
    roleAccessField.update((dbPrivMap) => dbPrivMap.without(roleOid));
  }

  async function save() {
    const rolesWithAccessRemoved = [...modifiablePrivileges.keys()]
      .filter((roleOid) => !$roleAccessField.has(roleOid))
      .map((roleOid) => ({
        role_oid: roleOid,
        direct: [],
      }));
    const rolesWithNewOrUpdatedAccess = [...$roleAccessField.values()].map(
      (entry) => ({
        role_oid: entry.roleOid,
        direct: entry.privileges.valuesArray(),
      }),
    );
    await savePrivilegesForRoles([
      ...rolesWithAccessRemoved,
      ...rolesWithNewOrUpdatedAccess,
    ]);
  }
</script>

<OverviewSection title={$_('granted_access')}>
  <DropdownMenu
    slot="actions"
    label={$_('add_roles')}
    icon={iconAddNew}
    triggerAppearance="plain-primary"
  >
    {#each [...roles.values()] as role (role.oid)}
      <ButtonMenuItem
        on:click={() => addAccess(role.oid)}
        disabled={$roleAccessField.has(role.oid) ||
          role.oid === permissionsMetaData.owner_oid}
      >
        {role.name}
      </ButtonMenuItem>
    {/each}
  </DropdownMenu>
  {#each [...$roleAccessField.values()] as roleAccess (roleAccess.roleOid)}
    <div class="access-control-row">
      <AccessControlRow
        rolesMap={roles}
        {accessLevelsInfoMap}
        {privilegeInfoMap}
        {roleAccess}
        {setAccess}
        {removeAccess}
      />
    </div>
  {:else}
    <div class="no-access">
      <WarningBox>
        {$_('access_not_granted_for_any_role')}
      </WarningBox>
    </div>
  {/each}
</OverviewSection>

<div use:portalToWindowFooter class="footer">
  <FormSubmit
    {form}
    canProceed={$form.hasChanges}
    catchErrors
    onCancel={() => {
      controller.close();
    }}
    onProceed={save}
    proceedButton={{ label: $_('save') }}
    cancelButton={{ label: $_('cancel') }}
  />
</div>

<style lang="scss">
  .access-control-row {
    padding: var(--size-base) 0;

    &:first-child {
      padding-top: 0;
    }

    &:last-child {
      padding-bottom: 0;
    }

    & + .access-control-row {
      border-top: 1px solid var(--slate-100);
    }
  }
</style>
