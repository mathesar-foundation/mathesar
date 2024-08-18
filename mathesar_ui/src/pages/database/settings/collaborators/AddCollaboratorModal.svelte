<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { User } from '@mathesar/api/rest/users';
  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import { Collaborator } from '@mathesar/models/Collaborator';
  import { ConfiguredRole } from '@mathesar/models/ConfiguredRole';
  import { toast } from '@mathesar/stores/toast';
  import {
    ControlledModal,
    ImmutableMap,
    type ModalController,
    Select,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import { getDatabaseSettingsContext } from '../databaseSettingsUtils';

  const databaseContext = getDatabaseSettingsContext();

  export let controller: ModalController;
  export let configuredRolesMap: ImmutableMap<number, ConfiguredRole>;
  export let usersMap: ImmutableMap<number, User>;
  export let collaboratorsMap: ImmutableMap<number, Collaborator>;

  const userId = requiredField<number | undefined>(undefined);
  const configuredRoleId = requiredField<number | undefined>(undefined);
  const form = makeForm({ userId, configuredRoleId });

  const SelectUser = Select<User['id']>;
  const SelectConfiguredRole = Select<ConfiguredRole['id']>;

  $: addedUsers = new Set(
    [...collaboratorsMap.values()].map((cbr) => cbr.user_id),
  );
  $: usersNotAdded = [...usersMap.values()].filter(
    (user) => !addedUsers.has(user.id),
  );

  async function addCollaborator() {
    if ($userId && $configuredRoleId) {
      await $databaseContext.addCollaborator($userId, $configuredRoleId);
      controller.close();
      toast.success($_('collaborator_added_successfully'));
      form.reset();
    }
  }
</script>

<ControlledModal {controller} on:close={() => form.reset()}>
  <span slot="title">
    {$_('add_collaborator')}
  </span>
  <div>
    <Field
      label={$_('mathesar_user')}
      layout="stacked"
      field={userId}
      input={{
        component: SelectUser,
        props: {
          options: usersNotAdded.map((user) => user.id),
          getLabel: (option) => {
            if (option) {
              return usersMap.get(option)?.username ?? String(option);
            }
            return $_('select_user');
          },
          autoSelect: 'none',
        },
      }}
    />
    <Field
      label={$_('role')}
      layout="stacked"
      field={configuredRoleId}
      input={{
        component: SelectConfiguredRole,
        props: {
          options: [...configuredRolesMap.values()].map((r) => r.id),
          getLabel: (option) => {
            if (option) {
              return configuredRolesMap.get(option)?.name ?? String(option);
            }
            return $_('select_role');
          },
          autoSelect: 'none',
        },
      }}
    />
  </div>
  <div use:portalToWindowFooter class="footer">
    <FormSubmit
      {form}
      catchErrors
      onCancel={() => {
        form.reset();
        controller.close();
      }}
      onProceed={addCollaborator}
      proceedButton={{ label: $_('add_collaborator') }}
      cancelButton={{ label: $_('cancel') }}
    />
  </div>
</ControlledModal>
