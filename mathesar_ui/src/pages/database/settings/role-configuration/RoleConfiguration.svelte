<script lang="ts">
  import { _ } from 'svelte-i18n';

  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import PhraseContainingIdentifier from '@mathesar/components/PhraseContainingIdentifier.svelte';
  import {
    type CombinedLoginRole,
    DatabaseSettingsRouteContext,
  } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import {
    iconConfigurePassword,
    iconDeleteMajor,
    iconEdit,
  } from '@mathesar/icons';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { confirm } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import {
    Button,
    Icon,
    Spinner,
    SpinnerButton,
  } from '@mathesar-component-library';

  import SettingsContentLayout from '../SettingsContentLayout.svelte';

  import ConfigureRoleModal from './ConfigureRoleModal.svelte';

  const routeContext = DatabaseSettingsRouteContext.get();
  const configureRoleModalController = modal.spawnModalController();
  const userProfileStore = getUserProfileStoreFromContext();
  $: ({ isMathesarAdmin } = $userProfileStore);

  $: ({ database, databaseRouteContext, configuredRoles, combinedLoginRoles } =
    $routeContext);
  $: ({ roles } = databaseRouteContext);
  $: void AsyncRpcApiStore.runBatchConservatively([
    configuredRoles.batchRunner({ server_id: database.server.id }),
    roles.batchRunner({ database_id: database.id }),
  ]);
  $: isLoading = $configuredRoles.isLoading || $roles.isLoading;

  let targetCombinedLoginRole: CombinedLoginRole | undefined;

  function configureRole(combinedLoginRole: CombinedLoginRole) {
    targetCombinedLoginRole = combinedLoginRole;
    configureRoleModalController.open();
  }

  async function removeConfiguredRole(combinedLoginRole: CombinedLoginRole) {
    if (combinedLoginRole.configuredRole) {
      try {
        await $routeContext.removeConfiguredRole(
          combinedLoginRole.configuredRole,
        );
        toast.success($_('role_configuration_removed'));
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }
  }
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('role_configuration')}
  </svelte:fragment>
  {#if isLoading}
    <Spinner />
  {:else}
    {#if $combinedLoginRoles.length > 0}
      <div class="role-configuration-table">
        <GridTable>
          <GridTableCell header>{$_('role')}</GridTableCell>
          <GridTableCell header>{$_('actions')}</GridTableCell>

          {#each $combinedLoginRoles as combinedLoginRole (combinedLoginRole.name)}
            <GridTableCell>
              <span class="role-name">
                {combinedLoginRole.name}
              </span>
            </GridTableCell>
            <GridTableCell>
              {#if combinedLoginRole.configuredRole}
                <div>
                  <Button
                    appearance="secondary"
                    on:click={() => configureRole(combinedLoginRole)}
                    disabled={!isMathesarAdmin}
                  >
                    <Icon {...iconEdit} size="0.8em" />
                    <span>{$_('configure_password')}</span>
                  </Button>
                  <SpinnerButton
                    appearance="secondary"
                    disabled={!isMathesarAdmin}
                    confirm={() =>
                      confirm({
                        title: {
                          component: PhraseContainingIdentifier,
                          props: {
                            identifier: combinedLoginRole.name,
                            wrappingString: $_(
                              'remove_configuration_for_identifier',
                            ),
                          },
                        },
                        body: $_('removing_role_configuration_warning', {
                          values: {
                            server:
                              combinedLoginRole.configuredRole?.database.server.getConnectionString(),
                          },
                        }),
                        proceedButton: {
                          label: $_('remove_configuration'),
                          icon: iconDeleteMajor,
                        },
                      })}
                    label={$_('remove')}
                    onClick={() => removeConfiguredRole(combinedLoginRole)}
                  />
                </div>
              {:else if combinedLoginRole.role}
                <Button
                  appearance="secondary"
                  on:click={() => configureRole(combinedLoginRole)}
                  disabled={!isMathesarAdmin}
                >
                  <Icon {...iconConfigurePassword} size="0.8em" />
                  <span>{$_('configure_in_mathesar')}</span>
                </Button>
              {/if}
            </GridTableCell>
          {/each}
        </GridTable>
      </div>
    {/if}

    {#if $configuredRoles.error}
      <ErrorBox fullWidth>
        {$configuredRoles.error}
      </ErrorBox>
    {/if}
    {#if $roles.error}
      <ErrorBox fullWidth>
        {$roles.error}
      </ErrorBox>
    {/if}
  {/if}
</SettingsContentLayout>

{#if targetCombinedLoginRole}
  <ConfigureRoleModal
    controller={configureRoleModalController}
    combinedLoginRole={targetCombinedLoginRole}
  />
{/if}

<style lang="scss">
  .role-configuration-table {
    background: var(--white);
    --Grid-table__template-columns: 3fr 2fr;

    .role-name {
      font-weight: 500;
    }
  }
</style>
