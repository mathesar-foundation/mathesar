<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Errors from '@mathesar/components/errors/Errors.svelte';
  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import PhraseContainingIdentifier from '@mathesar/components/PhraseContainingIdentifier.svelte';
  import SeeDocsToLearnMore from '@mathesar/components/SeeDocsToLearnMore.svelte';
  import Yes from '@mathesar/components/Yes.svelte';
  import {
    type CombinedLoginRole,
    DatabaseSettingsRouteContext,
  } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import { iconAddNew, iconDeleteMajor, iconEdit } from '@mathesar/icons';
  import AsyncRpcApiStore from '@mathesar/stores/AsyncRpcApiStore';
  import { confirm } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import { toast } from '@mathesar/stores/toast';
  import { getUserProfileStoreFromContext } from '@mathesar/stores/userProfile';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import {
    Button,
    Help,
    Icon,
    Spinner,
    SpinnerButton,
    isDefinedNonNullable,
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
  $: errors = [$configuredRoles.error, $roles.error].filter(
    isDefinedNonNullable,
  );

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
        toast.success($_('stored_password_removed'));
      } catch (err) {
        toast.error(getErrorMessage(err));
      }
    }
  }
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('stored_role_passwords')}
    <Help>
      {$_('stored_role_passwords_help')}
      <SeeDocsToLearnMore page="storedRolePasswords" />
    </Help>
  </svelte:fragment>
  {#if isLoading}
    <Spinner />
  {:else}
    {#if $combinedLoginRoles.length > 0}
      <div class="role-configuration-table">
        <GridTable>
          <GridTableCell header>{$_('role')}</GridTableCell>
          <GridTableCell header>{$_('stored_password')}</GridTableCell>

          {#each $combinedLoginRoles as combinedLoginRole (combinedLoginRole.name)}
            <GridTableCell>
              <span class="role-name">
                {combinedLoginRole.name}
              </span>
            </GridTableCell>
            <GridTableCell>
              <div class="password-saved-cell">
                <div>
                  {#if combinedLoginRole.configuredRole}
                    <Yes />
                  {/if}
                </div>
                <div>
                  {#if combinedLoginRole.configuredRole}
                    <Button
                      appearance="secondary"
                      on:click={() => configureRole(combinedLoginRole)}
                      disabled={!isMathesarAdmin}
                      tooltip={$_('update_stored_password')}
                    >
                      <Icon {...iconEdit} size="0.8em" />
                    </Button>
                    <SpinnerButton
                      appearance="outline-primary"
                      disabled={!isMathesarAdmin}
                      confirm={() =>
                        confirm({
                          title: {
                            component: PhraseContainingIdentifier,
                            props: {
                              identifier: combinedLoginRole.name,
                              wrappingString: $_(
                                'remove_stored_password_for_identifier',
                              ),
                            },
                          },
                          body: $_('remove_stored_password_help', {
                            values: {
                              server:
                                combinedLoginRole.configuredRole?.database.server.getConnectionString(),
                            },
                          }),
                          proceedButton: {
                            label: $_('remove_stored_password'),
                            icon: iconDeleteMajor,
                          },
                        })}
                      label=""
                      tooltip={$_('remove_stored_password')}
                      icon={iconDeleteMajor}
                      onClick={() => removeConfiguredRole(combinedLoginRole)}
                    />
                  {:else if combinedLoginRole.role}
                    <Button
                      appearance="secondary"
                      on:click={() => configureRole(combinedLoginRole)}
                      disabled={!isMathesarAdmin}
                      tooltip={$_('store_a_password')}
                    >
                      <Icon {...iconAddNew} size="0.8em" />
                    </Button>
                  {/if}
                </div>
              </div>
            </GridTableCell>
          {/each}
        </GridTable>
      </div>
    {/if}

    {#if errors.length}
      <Errors fullWidth {errors} />
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
    --Grid-table__template-columns: auto auto;

    .role-name {
      font-weight: 500;
    }
  }
  .password-saved-cell {
    width: 100%;
    display: grid;
    grid-template-columns: auto auto;
    justify-content: space-between;
  }
</style>
