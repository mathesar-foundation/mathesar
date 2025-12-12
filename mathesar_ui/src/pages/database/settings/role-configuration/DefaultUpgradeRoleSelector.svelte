<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database } from '@mathesar/models/Database';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { Select } from '@mathesar-component-library';

  export let database: Database;

  const userProfileStore = getUserProfileStoreFromContext();
  $: ({ isMathesarAdmin } = $userProfileStore);

  const configuredRolesStore = database.constructConfiguredRolesStore();
  $: configuredRoles = $configuredRolesStore;

  $: configuredRoleOptions = [
    { label: $_('none_no_default'), value: null },
    ...(configuredRoles?.data
      ? [...configuredRoles.data.values()].map((role) => ({
          label: role.name,
          value: role.id,
        }))
      : []),
  ];

  let selectedRoleId: number | null = database.defaultUpgradeRoleId;

  async function handleChange() {
    try {
      await database.setDefaultUpgradeRole(selectedRoleId);
      toast.success($_('default_upgrade_role_updated'));
    } catch (err) {
      toast.error(getErrorMessage(err));
      // Reset to previous value on error
      selectedRoleId = database.defaultUpgradeRoleId;
    }
  }
</script>

<div class="default-upgrade-role-selector">
  <Select
    bind:value={selectedRoleId}
    options={configuredRoleOptions}
    on:change={handleChange}
    disabled={!isMathesarAdmin}
  />
  {#if selectedRoleId}
    <p class="help-text">
      {$_('default_upgrade_role_selected_help')}
    </p>
  {:else}
    <p class="help-text">
      {$_('default_upgrade_role_none_help')}
    </p>
  {/if}
</div>

<style lang="scss">
  .default-upgrade-role-selector {
    display: flex;
    flex-direction: column;
    gap: 0.5rem;
    max-width: 30rem;
  }
  .help-text {
    font-size: 0.875rem;
    color: var(--color-text-muted);
    margin: 0;
  }
</style>
