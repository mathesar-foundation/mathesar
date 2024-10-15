<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { User } from '@mathesar/api/rest/users';
  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import { DatabaseSettingsRouteContext } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import type { Collaborator } from '@mathesar/models/Collaborator';
  import type { ConfiguredRole } from '@mathesar/models/ConfiguredRole';
  import { toast } from '@mathesar/stores/toast';
  import {
    ControlledModal,
    type ImmutableMap,
    type ModalController,
    Select,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import SelectConfiguredRoleField from './SelectConfiguredRoleField.svelte';

  const routeContext = DatabaseSettingsRouteContext.get();

  export let controller: ModalController;
  export let configuredRolesMap: ImmutableMap<number, ConfiguredRole>;
  export let usersMap: ImmutableMap<number, User>;
  export let collaboratorsMap: ImmutableMap<number, Collaborator>;
  export let onAdd: (collaborator: Collaborator) => void;

  const userId = requiredField<number | undefined>(undefined);
  const configuredRoleId = requiredField<number | undefined>(undefined);
  const form = makeForm({ userId, configuredRoleId });

  const SelectUser = Select<User['id']>;

  $: addedUsers = new Set(
    [...collaboratorsMap.values()].map((cbr) => cbr.userId),
  );

  async function addCollaborator() {
    if ($userId && $configuredRoleId) {
      const collaborator = await $routeContext.addCollaborator(
        $userId,
        $configuredRoleId,
      );
      onAdd(collaborator);
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
          options: [...usersMap.values()].map((user) => user.id),
          getLabel: (option) => {
            if (option) {
              return usersMap.get(option)?.username ?? String(option);
            }
            return $_('select_user');
          },
          autoSelect: 'none',
          isOptionDisabled: (option) =>
            option !== undefined && addedUsers.has(option),
        },
      }}
    />
    <SelectConfiguredRoleField {configuredRoleId} {configuredRolesMap} />
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
