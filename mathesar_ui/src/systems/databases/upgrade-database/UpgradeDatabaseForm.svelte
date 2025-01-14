<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { api } from '@mathesar/api/rpc';
  import {
    Field,
    FieldLayout,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import type { Database } from '@mathesar/models/Database';
  import {
    Checkbox,
    Help,
    LabeledInput,
    PasswordInput,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  export let database: Database;
  export let refreshDatabaseList: () => Promise<void>;
  export let close: () => void;
  export let isReinstall = false;

  const useRole = requiredField(false);
  const roleName = requiredField('');
  const rolePassword = requiredField('');

  $: form = $useRole ? makeForm({ roleName, rolePassword }) : makeForm({});

  async function submit() {
    await api.databases
      .upgrade_sql({
        database_id: database.id,
        ...($useRole
          ? {
              username: $roleName,
              password: $rolePassword,
            }
          : {}),
      })
      .run();
    await refreshDatabaseList();
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
