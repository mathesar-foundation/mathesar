<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    FieldLayout,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import InfoBox from '@mathesar/components/message-boxes/InfoBox.svelte';
  import RichText from '@mathesar/components/rich-text/RichText.svelte';
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
    <RichText text={$_('update_stored_password_for_role')} let:slotName>
      {#if slotName === 'role'}
        <Identifier>{combinedLoginRole.name}</Identifier>
      {/if}
    </RichText>
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
      <InfoBox>
        {$_('role_configured_all_databases_in_server', {
          values: {
            server: database.server.getConnectionString(),
          },
        })}
      </InfoBox>
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
      proceedButton={{ label: $_('save_password') }}
      cancelButton={{ label: $_('cancel') }}
    />
  </div>
</ControlledModal>
