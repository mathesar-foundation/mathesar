<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import {
    Field,
    FieldLayout,
    FormSubmit,
    makeForm,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import type { Database } from '@mathesar/models/Database';
  import { toast } from '@mathesar/stores/toast';
  import {
    Checkbox,
    Help,
    LabeledInput,
    PasswordInput,
    Select,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  export let database: Database;
  export let refreshDatabaseList: () => Promise<void>;
  export let close: () => void;
  export let isReinstall = false;

  const useRole = requiredField(false);
  const useSpecificRole = requiredField('default');
  const configuredRoleId = optionalField<number | null>(null);
  const roleName = requiredField('');
  const rolePassword = requiredField('');

  const configuredRolesStore = database.constructConfiguredRolesStore();
  $: configuredRoles = $configuredRolesStore;

  $: roleOptions = [
    { label: $_('use_default_upgrade_role'), value: 'default' },
    { label: $_('use_configured_role'), value: 'configured' },
    { label: $_('enter_credentials_manually'), value: 'manual' },
  ];

  $: configuredRoleOptions =
    configuredRoles?.data
      ? [...configuredRoles.data.values()].map((role) => ({
          label: role.name,
          value: role.id,
        }))
      : [];

  $: {
    if ($useSpecificRole === 'default') {
      form = makeForm({});
    } else if ($useSpecificRole === 'configured') {
      form = makeForm({ configuredRoleId });
    } else {
      form = makeForm({ roleName, rolePassword });
    }
  }

  let form = makeForm({});

  async function submit() {
    const params: {
      database_id: number;
      username?: string;
      password?: string;
    } = { database_id: database.id };

    if ($useRole) {
      if ($useSpecificRole === 'configured' && $configuredRoleId) {
        const selectedRole = configuredRoles?.data?.get($configuredRoleId);
        if (selectedRole) {
          // Pass username only; backend will look up the password from ConfiguredRole
          params.username = selectedRole.name;
        }
      } else if ($useSpecificRole === 'manual') {
        params.username = $roleName;
        params.password = $rolePassword;
      }
      // For 'default', no params needed - backend will use database's default_upgrade_role
    }

    await api.databases.upgrade_sql(params).run();
    await refreshDatabaseList();
    if (isReinstall) {
      toast.success($_('database_reinstalled_successfully'));
    } else {
      toast.success($_('database_upgraded_successfully'));
    }
    close();
  }
</script>

<div>
  <FieldLayout>
    {#if isReinstall}
      {$_('reinstall_database_form_info')}
    {:else}
      {$_('upgrade_database_form_info')}
    {/if}
  </FieldLayout>
  <FieldLayout>
    <LabeledInput layout="inline-input-first">
      <div slot="label">
        {$_('specify_a_role')}
        <Help>
          {$_('upgrade_specify_a_role_help')}
        </Help>
      </div>
      <Checkbox bind:checked={$useRole} />
    </LabeledInput>
  </FieldLayout>

  {#if $useRole}
    <Field
      label={$_('role_selection_method')}
      layout="stacked"
      field={useSpecificRole}
      input={{ component: Select, props: { options: roleOptions } }}
    />

    {#if $useSpecificRole === 'configured'}
      <Field
        label={$_('select_configured_role')}
        layout="stacked"
        field={configuredRoleId}
        input={{
          component: Select,
          props: { options: configuredRoleOptions },
        }}
      />
    {:else if $useSpecificRole === 'manual'}
      <Field label={$_('role_name')} layout="stacked" field={roleName} />
      <Field
        label={$_('role_password')}
        layout="stacked"
        field={rolePassword}
        input={{
          component: PasswordInput,
          props: { autocomplete: 'off' },
        }}
      />
    {:else if $useSpecificRole === 'default'}
      {#if database.defaultUpgradeRoleId}
        <FieldLayout>
          {$_('using_default_upgrade_role_message')}
        </FieldLayout>
      {:else}
        <FieldLayout>
          {$_('no_default_upgrade_role_set_message')}
        </FieldLayout>
      {/if}
    {/if}
  {/if}
</div>

<div use:portalToWindowFooter>
  <FormSubmit
    {form}
    catchErrors
    onCancel={() => {
      form.reset();
      close();
    }}
    onProceed={submit}
    proceedButton={{
      label: isReinstall ? $_('reinstall') : $_('upgrade_database'),
    }}
    cancelButton={{ label: $_('cancel') }}
  />
</div>
