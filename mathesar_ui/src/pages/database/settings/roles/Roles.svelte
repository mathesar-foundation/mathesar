<script lang="ts">
  import { _ } from 'svelte-i18n';

  import GridTable from '@mathesar/components/grid-table/GridTable.svelte';
  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconAddNew, iconEdit } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import { Button, Icon, Spinner } from '@mathesar-component-library';

  import { getDatabaseSettingsContext } from '../databaseSettingsUtils';
  import SettingsContentLayout from '../SettingsContentLayout.svelte';

  import CreateRoleModal from './CreateRoleModal.svelte';

  const databaseContext = getDatabaseSettingsContext();
  const createRoleModalController = modal.spawnModalController();

  $: ({ database, roles } = $databaseContext);

  $: void roles.runIfNotInitialized({ database_id: database.id });
  $: roleList = [...($roles.resolvedValue?.values() ?? [])];
</script>

<SettingsContentLayout>
  <svelte:fragment slot="title">
    {$_('roles')}
  </svelte:fragment>
  <svelte:fragment slot="actions">
    {#if !$roles.isLoading}
      <Button
        appearance="primary"
        on:click={() => createRoleModalController.open()}
      >
        <Icon {...iconAddNew} />
        <span>{$_('create_role')}</span>
      </Button>
    {/if}
  </svelte:fragment>
  {#if $roles.isLoading}
    <Spinner />
  {:else if $roles.isOk}
    <div class="roles-table">
      <GridTable>
        <GridTableCell header>{$_('role')}</GridTableCell>
        <!--eslint-disable-next-line @intlify/svelte/no-raw-text -->
        <GridTableCell header>LOGIN</GridTableCell>
        <GridTableCell header>
          {$_('child_roles')}
        </GridTableCell>
        <GridTableCell header>{$_('actions')}</GridTableCell>
        {#each roleList as role (role.name)}
          <GridTableCell>{role.name}</GridTableCell>
          <GridTableCell>
            {role.login ? $_('yes') : $_('no')}
          </GridTableCell>
          <GridTableCell>
            <div class="child-roles">
              <div class="role-list">
                {#each role.members ?? [] as member (member.oid)}
                  <span class="role-name">
                    {$roles.resolvedValue?.get(member.oid)?.name ?? ''}
                  </span>
                {/each}
              </div>
              <div class="actions">
                <Button appearance="secondary">
                  <Icon {...iconEdit} size="0.8em" />
                </Button>
              </div>
            </div>
          </GridTableCell>
          <GridTableCell>
            <Button appearance="outline-primary">
              {$_('drop_role')}
            </Button>
          </GridTableCell>
        {/each}
      </GridTable>
    </div>
  {:else if $roles.error}
    <ErrorBox fullWidth>
      {$roles.error}
    </ErrorBox>
  {/if}
</SettingsContentLayout>

<CreateRoleModal controller={createRoleModalController} />

<style lang="scss">
  .roles-table {
    --Grid-table__template-columns: 3fr 2fr 4fr 2fr;
    background: var(--white);

    .child-roles {
      display: flex;
      width: 100%;
      align-items: center;

      .role-list {
        display: flex;
        gap: 6px;
      }

      .actions {
        margin-left: auto;
      }
    }
  }
</style>
