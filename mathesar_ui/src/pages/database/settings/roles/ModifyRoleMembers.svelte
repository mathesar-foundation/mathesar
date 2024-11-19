<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import RichText from '@mathesar/components/rich-text/RichText.svelte';
  import { iconDeleteMajor } from '@mathesar/icons';
  import type { Role } from '@mathesar/models/Role';
  import { toast } from '@mathesar/stores/toast';
  import {
    Button,
    ButtonMenuItem,
    ControlledModal,
    DropdownMenu,
    Icon,
    type ImmutableMap,
    ImmutableSet,
    type ModalController,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  export let controller: ModalController;
  export let parentRole: Role;
  export let rolesMap: ImmutableMap<number, Role>;
  export let onSave: (props: { parentRole: Role }) => void;

  $: savedMembers = parentRole.members;
  $: savedMemberOids = new Set([...$savedMembers.keys()]);
  $: memberOids = requiredField<ImmutableSet<number>>(
    new ImmutableSet(savedMemberOids),
  );
  $: form = makeForm({ memberOids });
  $: ({ hasChanges } = $form);

  $: rolesAvailableToAddAsMember = [...rolesMap.values()].filter(
    (role) => role.oid !== parentRole.oid,
  );

  function addMember(memberOid: Role['oid']) {
    memberOids.update((_existingMembers) => _existingMembers.with(memberOid));
  }

  function removeMember(memberOid: Role['oid']) {
    memberOids.update((_existingMembers) =>
      _existingMembers.without(memberOid),
    );
  }

  async function saveMembers() {
    await parentRole.setMembers(new Set($memberOids));
    onSave({ parentRole });
    controller.close();
    toast.success($_('child_roles_saved_successfully'));
  }
</script>

<ControlledModal {controller} on:close={() => form.reset()}>
  <span slot="title">
    <RichText text={$_('edit_child_roles_for_parent')} let:slotName>
      {#if slotName === 'parent'}
        <Identifier>{parentRole.name}</Identifier>
      {/if}
    </RichText>
  </span>
  <div>
    <div class="menu-section">
      <DropdownMenu label={$_('add_child_roles')} triggerAppearance="secondary">
        {#each rolesAvailableToAddAsMember as role (role.oid)}
          <ButtonMenuItem
            on:click={() => addMember(role.oid)}
            disabled={$memberOids.has(role.oid)}
          >
            {role.name}
          </ButtonMenuItem>
        {/each}
      </DropdownMenu>

      {#if hasChanges}
        <div class="changes-warning">
          <WarningBox>
            {$_('click_save_button_to_save_changes')}
          </WarningBox>
        </div>
      {/if}
    </div>
    <div class="member-list">
      {#if $memberOids.size > 0}
        {#each [...$memberOids] as memberOid (memberOid)}
          <div class="member">
            <span>
              {rolesMap.get(memberOid)?.name ?? memberOid}
            </span>
            <span class="remove">
              <Button
                appearance="secondary"
                on:click={() => removeMember(memberOid)}
              >
                <Icon {...iconDeleteMajor} size="0.8em" />
              </Button>
            </span>
          </div>
        {/each}
      {:else}
        <InfoBox fullWidth>
          {$_('role_has_no_child_roles')}
        </InfoBox>
      {/if}
    </div>
  </div>
  <div use:portalToWindowFooter class="footer">
    <FormSubmit
      {form}
      catchErrors
      canProceed={hasChanges}
      onCancel={() => {
        form.reset();
        controller.close();
      }}
      onProceed={saveMembers}
      proceedButton={{ label: $_('save') }}
      cancelButton={{ label: $_('cancel') }}
    />
  </div>
</ControlledModal>

<style lang="scss">
  .menu-section {
    display: flex;

    .changes-warning {
      margin-left: auto;
      font-size: var(--text-size-small);
    }
  }
  .member-list {
    margin-top: var(--size-x-small);

    .member {
      display: flex;
      align-items: center;
      padding: var(--size-x-small) 0;

      .remove {
        margin-left: auto;
      }

      &:not(:last-child) {
        border-bottom: 1px solid var(--slate-200);
      }
    }
  }
</style>
