<script lang="ts">
  import { _ } from 'svelte-i18n';

  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import PhraseContainingIdentifier from '@mathesar/components/PhraseContainingIdentifier.svelte';
  import { DatabaseSettingsRouteContext } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import { iconDeleteMajor, iconEdit } from '@mathesar/icons';
  import type { Role } from '@mathesar/models/Role';
  import { confirm } from '@mathesar/stores/confirmation';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import {
    Button,
    Icon,
    type ImmutableMap,
    SpinnerButton,
  } from '@mathesar-component-library';

  const routeContext = DatabaseSettingsRouteContext.get();

  export let role: Role;
  export let rolesMap: ImmutableMap<number, Role>;
  export let modifyMembersForRole: (role: Role) => void;
  export let handleRoleChangeSideEffects: (role: Role) => void;

  $: members = role.members;

  async function dropRole() {
    try {
      await $routeContext.databaseRouteContext.deleteRole(role);
      handleRoleChangeSideEffects(role);
      toast.success($_('role_dropped_successfully'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }
</script>

<GridTableCell>{role.name}</GridTableCell>
<GridTableCell>
  {#if role.login}
    {$_('yes')}
  {/if}
</GridTableCell>
<GridTableCell>
  <div class="child-roles">
    <div class="role-list">
      {#each [...$members.values()] as member (member.oid)}
        <span class="role-name">
          {rolesMap.get(member.oid)?.name ?? ''}
        </span>
      {/each}
    </div>
    <div class="actions">
      <Button
        appearance="secondary"
        on:click={() => modifyMembersForRole(role)}
      >
        <Icon {...iconEdit} size="0.8em" />
      </Button>
    </div>
  </div>
</GridTableCell>
<GridTableCell>
  <SpinnerButton
    appearance="outline-primary"
    confirm={() =>
      confirm({
        title: {
          component: PhraseContainingIdentifier,
          props: {
            identifier: role.name,
            wrappingString: $_('drop_role_with_identifier'),
          },
        },
        body: [
          $_('action_cannot_be_undone'),
          $_('drop_role_warning'),
          $_('are_you_sure_to_proceed'),
        ],
        proceedButton: {
          label: $_('drop_role'),
          icon: iconDeleteMajor,
        },
      })}
    label={$_('drop_role')}
    onClick={dropRole}
  />
</GridTableCell>

<style lang="scss">
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
</style>
