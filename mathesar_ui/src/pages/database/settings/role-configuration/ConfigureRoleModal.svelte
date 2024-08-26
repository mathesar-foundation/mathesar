<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    FieldLayout,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import {
    type CombinedLoginRole,
    DatabaseSettingsRouteContext,
  } from '@mathesar/contexts/DatabaseSettingsRouteContext';
  import { toast } from '@mathesar/stores/toast';
  import {
    ControlledModal,
    type ModalController,
    PasswordInput,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  const databaseContext = DatabaseSettingsRouteContext.get();
  $: ({ database } = $databaseContext);

  export let controller: ModalController;
  export let combinedLoginRole: CombinedLoginRole;

  const password = requiredField('');
  const form = makeForm({ password });

  async function configureRole() {
    await $databaseContext.configureRole(combinedLoginRole, $password);
    controller.close();
    if (combinedLoginRole.configuredRole) {
      toast.success($_('role_configured_successfully_new_password'));
    } else {
      toast.success($_('role_configured_successfully'));
    }
  }
</script>

<ControlledModal {controller} on:close={() => form.reset()}>
  <span slot="title">
    {$_('configure_value', {
      values: { value: combinedLoginRole.name },
    })}
  </span>
  <div>
    <Field
      label={$_('password')}
      layout="stacked"
      field={password}
      input={{
        component: PasswordInput,
        props: { autocomplete: 'off' },
      }}
    />
    <FieldLayout>
      <WarningBox>
        {$_('role_configured_all_databases_in_server', {
          values: {
            server: database.server.getConnectionString(),
          },
        })}
      </WarningBox>
    </FieldLayout>
  </div>
  <div use:portalToWindowFooter class="footer">
    <FormSubmit
      {form}
      catchErrors
      onCancel={() => {
        controller.close();
      }}
      onProceed={configureRole}
      proceedButton={{ label: $_('authenticate') }}
      cancelButton={{ label: $_('cancel') }}
    />
  </div>
</ControlledModal>
