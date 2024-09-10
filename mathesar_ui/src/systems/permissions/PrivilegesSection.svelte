<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Errors from '@mathesar/components/Errors.svelte';
  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import type { Role } from '@mathesar/models/Role';
  import {
    ImmutableMap,
    type ModalController,
    Spinner,
    isDefinedNonNullable,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import DirectPrivilegeRow from './DirectPrivilegeRow.svelte';
  import RoleWithChildren from './RoleWithChildren.svelte';
  import {
    type AccessLevelConfig,
    type AsyncStoresValues,
    type RoleAccessLevelAndPrivileges,
    getObjectAccessPrivilegeMap,
  } from './utils';

  type AccessLevel = $$Generic;
  type Privilege = $$Generic;

  export let controller: ModalController;
  export let accessLevelConfig: AccessLevelConfig<AccessLevel, Privilege>[];
  export let getAsyncStores: () => AsyncStoresValues<Privilege>;
  export let allPrivileges: Privilege[];
  export let savePermissions: () => void;

  $: ({ roles, objectPrivileges, objectOwnerAndCurrentRolePrivileges } =
    getAsyncStores());

  $: isLoading =
    $roles.isLoading ||
    $objectPrivileges.isLoading ||
    $objectOwnerAndCurrentRolePrivileges.isLoading;
  $: isSuccess =
    $roles.isOk &&
    $objectPrivileges.isOk &&
    $objectOwnerAndCurrentRolePrivileges.isOk;
  $: errors = [
    $roles.error,
    $objectPrivileges.error,
    $objectOwnerAndCurrentRolePrivileges.error,
  ].filter((entry): entry is string => isDefinedNonNullable(entry));

  $: objectPrivilegesField = requiredField(
    getObjectAccessPrivilegeMap(
      accessLevelConfig,
      $objectPrivileges.resolvedValue ?? new ImmutableMap(),
    ),
  );
  $: form = makeForm({ objectPrivilegesField });
  $: objectPrivilegesWithAccess = [...$objectPrivilegesField.values()].filter(
    (entry) => isDefinedNonNullable(entry.accessLevel),
  );

  function setRoleAccessLevelAndPrivileges(
    roleOid: Role['oid'],
    accessLevelPrivileges: RoleAccessLevelAndPrivileges<AccessLevel, Privilege>,
  ) {
    objectPrivilegesField.update((dbPrivMap) =>
      dbPrivMap.with(roleOid, accessLevelPrivileges),
    );
  }
</script>

<div class="privileges">
  {#if isLoading}
    <Spinner />
  {:else if isSuccess && $roles.resolvedValue && $objectOwnerAndCurrentRolePrivileges.resolvedValue}
    <div class="section owner-section">
      <div class="title">{$_('owner')}</div>
      <div class="content">
        <RoleWithChildren
          rolesMap={$roles.resolvedValue}
          roleOid={$objectOwnerAndCurrentRolePrivileges.resolvedValue.owner_oid}
        />
      </div>
    </div>
    <div class="section granted-access-section">
      <div class="title">{$_('granted_access')}</div>
      <div class="content">
        {#each objectPrivilegesWithAccess as roleAccessLevelAndPrivileges (roleAccessLevelAndPrivileges.roleOid)}
          <div class="privilege-row">
            <DirectPrivilegeRow
              rolesMap={$roles.resolvedValue}
              privileges={allPrivileges}
              accessLevels={accessLevelConfig}
              {roleAccessLevelAndPrivileges}
              {setRoleAccessLevelAndPrivileges}
            />
          </div>
        {/each}
      </div>
    </div>
  {:else}
    <Errors {errors} fullWidth />
  {/if}
</div>

<div use:portalToWindowFooter class="footer">
  <FormSubmit
    {form}
    canProceed={$form.hasChanges}
    catchErrors
    onCancel={() => {
      controller.close();
    }}
    onProceed={savePermissions}
    proceedButton={{ label: $_('save') }}
    cancelButton={{ label: $_('cancel') }}
  />
</div>

<style lang="scss">
  .privileges {
    .section {
      margin-top: var(--size-base);

      .title {
        font-weight: 600;
        border-bottom: 1px solid var(--slate-200);
        padding: var(--size-extreme-small) 0;
      }

      &.owner-section {
        .content {
          padding: var(--size-base) 0 var(--size-ultra-small) 0;
        }
      }
    }
    .granted-access-section {
      .privilege-row {
        padding: var(--size-base) 0;

        &:last-child {
          padding-bottom: 0;
        }

        & + .privilege-row {
          border-top: 1px solid var(--slate-100);
        }
      }
    }
  }
</style>
