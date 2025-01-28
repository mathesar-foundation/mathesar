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
  import { highlightNewItems } from '@mathesar/packages/new-item-highlighter';
  import {
    ButtonMenuItem,
    DropdownMenu,
    type ImmutableMap,
    type ModalController,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import type {
    PermissionsMetaData,
    RolePrivileges,
  } from '../permissionsUtils';

  import AccessControlRow from './AccessControlRow.svelte';
  import OverviewSection from './OverviewSection.svelte';
  import {
    type AccessControlConfig,
    getObjectAccessPrivilegeMap,
  } from './overviewUtils';
  import {
    RoleAccessLevelAndPrivileges,
    customAccess,
  } from './RoleAccessLevelAndPrivileges';

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

  $: ({ ownerOid, currentRoleOwns } = permissionsMetaData.currentAccess);
  $: modifiablePrivileges = privilegesForRoles.filterValues(
    (pr) => pr.role_oid !== $ownerOid,
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
    controller.close();
  }
</script>

<OverviewSection title={$_('granted_privileges')}>
  <svelte:fragment slot="actions">
    {#if $currentRoleOwns}
      <DropdownMenu
        label={$_('add_roles')}
        icon={iconAddNew}
        triggerAppearance="plain-primary"
      >
        {#each [...roles.values()] as role (role.oid)}
          <ButtonMenuItem
            on:click={() => addAccess(role.oid)}
            disabled={$roleAccessField.has(role.oid) || role.oid === $ownerOid}
          >
            {role.name}
          </ButtonMenuItem>
        {/each}
      </DropdownMenu>
    {/if}
  </svelte:fragment>

  <div
    class="access-control-rows"
    class:empty={$roleAccessField.size === 0}
    use:highlightNewItems={{
      scrollHint: $_('privileges_new_items_scroll_hint'),
    }}
  >
    {#each [...$roleAccessField.values()] as roleAccess (roleAccess.roleOid)}
      <div class="access-control-row">
        <AccessControlRow
          rolesMap={roles}
          {permissionsMetaData}
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
  </div>
</OverviewSection>

{#if $currentRoleOwns}
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
{/if}

<style lang="scss">
  .access-control-rows:not(.empty) {
    margin-block: calc(-1 * var(--size-base));
  }

  .access-control-row {
    padding: var(--size-base) 0;

    & + .access-control-row {
      border-top: 1px solid var(--slate-100);
    }
  }
</style>
