<script lang="ts">
  import { _ } from 'svelte-i18n';

  import GridTableCell from '@mathesar/components/grid-table/GridTableCell.svelte';
  import PhraseContainingIdentifier from '@mathesar/components/PhraseContainingIdentifier.svelte';
  import RichText from '@mathesar/components/rich-text/RichText.svelte';
  import Yes from '@mathesar/components/Yes.svelte';
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
    isDefinedNonNullable,
  } from '@mathesar-component-library';

  const routeContext = DatabaseSettingsRouteContext.get();

  export let role: Role;
  export let rolesMap: ImmutableMap<number, Role>;
  export let onClickEditMembers: (role: Role) => void;
  export let onDrop: (role: Role) => void;

  $: membersMap = role.members;
  $: memberIds = [...$membersMap.keys()];
  $: memberNames = memberIds
    .map((id) => rolesMap.get(id)?.name)
    .filter(isDefinedNonNullable)
    .sort();

  async function dropRole() {
    try {
      await $routeContext.databaseRouteContext.deleteRole(role);
      onDrop(role);
      toast.success($_('role_dropped_successfully'));
    } catch (err) {
      toast.error(getErrorMessage(err));
    }
  }
</script>

<GridTableCell>{role.name}</GridTableCell>
<GridTableCell>
  {#if role.login}
    <Yes />
  {/if}
</GridTableCell>
<GridTableCell>
  <div class="child-roles">
    <ul class="role-list">
      {#each memberNames as member (member)}
        <li>{member}</li>
      {/each}
    </ul>
    <div class="actions">
      <Button appearance="secondary" on:click={() => onClickEditMembers(role)}>
        <div slot="tooltip">
          <RichText text={$_('edit_child_roles_for_parent')} let:slotName>
            {#if slotName === 'parent'}
              <b>{role.name}</b>
            {/if}
          </RichText>
        </div>
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
            identifierKey: 'name',
            identifier: role.name,
            wrappingString: $_('drop_role_name_question'),
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
    label=""
    tooltip={$_('drop_role')}
    icon={iconDeleteMajor}
    onClick={dropRole}
  />
</GridTableCell>

<style lang="scss">
  .child-roles {
    display: flex;
    width: 100%;
    align-items: center;
  }

  .role-list {
    margin: 0;
    padding: 0 0 0 1rem;
  }

  .actions {
    margin-left: auto;
  }
</style>
