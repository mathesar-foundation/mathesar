<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { User } from '@mathesar/api/rest/users';
  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import type { Collaborator } from '@mathesar/models/Collaborator';
  import type { ConfiguredRole } from '@mathesar/models/ConfiguredRole';
  import { toast } from '@mathesar/stores/toast';
  import {
    ControlledModal,
    type ImmutableMap,
    type ModalController,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import SelectConfiguredRoleField from './SelectConfiguredRoleField.svelte';

  export let controller: ModalController;
  export let collaborator: Collaborator;
  export let configuredRolesMap: ImmutableMap<number, ConfiguredRole>;
  export let usersMap: ImmutableMap<number, User>;

  $: savedConfiguredRoleId = collaborator.configured_role_id;
  $: configuredRoleId = requiredField<number>($savedConfiguredRoleId);
  $: form = makeForm({ configuredRoleId });

  $: userName =
    usersMap.get(collaborator.user_id)?.username ??
    String(collaborator.user_id);

  async function updateRoleForCollaborator() {
    await collaborator.setConfiguredRole($configuredRoleId);
    controller.close();
    toast.success($_('collaborator_role_updated_successfully'));
  }
</script>

<ControlledModal {controller} on:close={() => form.reset()}>
  <span slot="title">
    {$_('edit_role_for_collaborator_value', {
      values: {
        collaborator: userName,
      },
    })}
  </span>
  <div>
    <SelectConfiguredRoleField {configuredRoleId} {configuredRolesMap} />
  </div>
  <div use:portalToWindowFooter class="footer">
    <FormSubmit
      {form}
      catchErrors
      onCancel={() => {
        controller.close();
      }}
      onProceed={updateRoleForCollaborator}
      proceedButton={{ label: $_('save') }}
      cancelButton={{ label: $_('cancel') }}
    />
  </div>
</ControlledModal>
