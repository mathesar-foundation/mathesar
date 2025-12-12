<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Errors from '@mathesar/components/errors/Errors.svelte';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import {
    Icon,
    ImmutableMap,
    Select,
    Spinner,
    Tooltip,
    iconWarning,
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  import type { EditableDataFormManager } from '../../data-form-utilities/DataFormManager';

  const user = getUserProfileStoreFromContext();

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
  $: configuredRoleIds = new Set(
    [...configuredRolesValue.values()].map((r) => r.id),
  );
  $: allowedRoleIds = (() => {
    if ($user.isMathesarAdmin || $currentRole.resolvedValue?.super) {
      return configuredRoleIds;
    }
    if (!$currentRole.resolvedValue) {
      return new Set();
    }
    const allowedRoles = new Set([
      $currentRole.resolvedValue.name,
      ...[...$currentRole.resolvedValue.parentRoles.values()].map(
        (pr) => pr.name,
      ),
    ]);
    return new Set(
      [...configuredRolesValue.values()]
        .filter((cr) => allowedRoles.has(cr.name))
        .map((cr) => cr.id),
    );
  })();

  $: ({ associatedRoleId } = dataFormManager.dataFormStructure);
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
        options={[...configuredRoleIds]}
        getLabel={(option) => {
          if (isDefinedNonNullable(option)) {
            return configuredRolesValue.get(option)?.name ?? '';
          }
          return '';
        }}
        isOptionDisabled={(option) => !allowedRoleIds.has(option)}
        on:change={(e) =>
          dataFormManager.dataFormStructure.setAssociatedRoleId(
            e.detail ?? null,
          )}
        let:option
        let:label
      >
        <div>
          {label}
          {#if !allowedRoleIds.has(option)}
            <Tooltip>
              <Icon slot="trigger" {...iconWarning} />
              <span slot="content">{$_('you_do_not_have_access_to_role')}</span>
            </Tooltip>
          {/if}
        </div>
      </Select>
    </div>
  {/if}
</div>
