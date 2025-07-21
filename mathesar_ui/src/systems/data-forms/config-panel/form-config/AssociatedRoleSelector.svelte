<script lang="ts">
  import Errors from '@mathesar/components/errors/Errors.svelte';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import {
    ImmutableMap,
    Select,
    Spinner,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';

  export let dataFormManager: EditableDataFormManager;

  $: ({ schema } = dataFormManager);
  $: currentRole = schema.database.constructCurrentRoleStore();
  $: configuredRoles = schema.database.constructConfiguredRolesStore();

  $: void AsyncRpcApiStore.runBatchConservatively([
    configuredRoles.batchRunner(),
    currentRole.batchRunner(),
  ]);

  $: isLoading = $configuredRoles.isLoading || $currentRole.isLoading;
  $: errors = [$configuredRoles.error, $currentRole.error].filter(
    isDefinedNonNullable,
  );

  $: configuredRolesValue = new ImmutableMap($configuredRoles.resolvedValue);
  $: currentRoleValue = $currentRole.resolvedValue;
  $: configuredRoleIds = [...configuredRolesValue.values()].map((r) => r.id);
  $: currentRoleInfo = currentRoleValue
    ? configuredRolesValue.get(currentRoleValue.currentRoleOid)
    : undefined;

  $: ({ associatedRoleId } = dataFormManager.ephemeralDataForm);
</script>

<div>
  {#if isLoading}
    <Spinner />
  {:else if errors.length}
    <Errors {errors} fullWidth />
  {:else}
    <div>
      <Select
        value={$associatedRoleId}
        options={configuredRoleIds}
        getLabel={(option) => {
          if (isDefinedNonNullable(option)) {
            return configuredRolesValue.get(option)?.name ?? '';
          }
          return '';
        }}
        on:change={(e) =>
          dataFormManager.ephemeralDataForm.setAssociatedRoleId(
            e.detail ?? null,
          )}
      />
    </div>
  {/if}
</div>
