<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RawDatabasePrivilegesForRole } from '@mathesar/api/rpc/databases';
  import Errors from '@mathesar/components/Errors.svelte';
  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import { DatabaseRouteContext } from '@mathesar/contexts/DatabaseRouteContext';
  import type { Database } from '@mathesar/models/Database';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import {
    ImmutableMap,
    type ModalController,
    Spinner,
    isDefinedNonNullable,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import DirectPrivilegeRow from './DirectPrivilegeRow.svelte';

  export let controller: ModalController;
  export let databasePrivileges: ReturnType<
    Database['constructDatabasePrivilegesStore']
  >;

  const databaseContext = DatabaseRouteContext.get();
  $: ({ database, roles, underlyingDatabase } = $databaseContext);
  $: void AsyncRpcApiStore.runBatched(
    [
      roles.batchRunner({ database_id: database.id }),
      databasePrivileges.batchRunner({ database_id: database.id }),
      underlyingDatabase.batchRunner({ database_id: database.id }),
    ],
    { onlyRunIfNotInitialized: true },
  );

  $: isLoading =
    $roles.isLoading ||
    $databasePrivileges.isLoading ||
    $underlyingDatabase.isLoading;
  $: isSuccess =
    $roles.isOk && $databasePrivileges.isOk && $underlyingDatabase.isOk;
  $: errors = [
    $roles.error,
    $databasePrivileges.error,
    $underlyingDatabase.error,
  ].filter((entry): entry is string => isDefinedNonNullable(entry));

  $: dbPrivilegesMap =
    $databasePrivileges.resolvedValue ??
    new ImmutableMap<
      RawDatabasePrivilegesForRole['role_oid'],
      RawDatabasePrivilegesForRole
    >();
  $: dbPrivilegesLocalMap = new ImmutableMap(dbPrivilegesMap);
  $: dbPrivileges = requiredField(dbPrivilegesLocalMap);
  $: form = makeForm({ dbPrivileges });

  function savePermissions() {}
</script>

<div class="privileges">
  {#if isLoading}
    <Spinner />
  {:else if isSuccess && $roles.resolvedValue}
    <div class="section owner-section">
      <div class="title">{$_('owner')}</div>
      <div class="content"></div>
    </div>
    <div class="section granted-access-section">
      <div class="title">{$_('granted_access')}</div>
      <div class="content">
        {#each [...dbPrivilegesMap.values()] as dbPrivilegeForRole (dbPrivilegeForRole)}
          <div class="privilege-row">
            <DirectPrivilegeRow
              rolesMap={$roles.resolvedValue}
              {dbPrivilegeForRole}
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
      padding: var(--size-base) 0;

      .title {
        font-weight: 600;
        border-bottom: 1px solid var(--slate-200);
        padding: var(--size-extreme-small) 0;
      }
    }
    .granted-access-section {
      .privilege-row {
        padding: var(--size-base) 0;

        & + .privilege-row {
          border-top: 1px solid var(--slate-100);
        }
      }
    }
  }
</style>
