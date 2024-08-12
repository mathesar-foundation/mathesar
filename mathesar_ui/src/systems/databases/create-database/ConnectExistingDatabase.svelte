<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    FieldLayout,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import type { Database } from '@mathesar/models/databases';
  import { databasesStore } from '@mathesar/stores/databases';
  import {
    NumberInput,
    PasswordInput,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import {
    type InstallationSchema,
    getSampleSchemasFromInstallationSchemas,
  } from './createDatabaseUtils';
  import InstallationSchemaSelector from './InstallationSchemaSelector.svelte';

  export let onCancel: () => void;
  export let onSuccess: (db: Database) => void;

  const databaseName = requiredField('');
  const host = requiredField('localhost');
  const port = requiredField(5432);
  const role = requiredField('');
  const password = requiredField('');
  const installationSchemas = requiredField<InstallationSchema[]>(['internal']);
  const form = makeForm({
    databaseName,
    host,
    port,
    role,
    password,
    installationSchemas,
  });

  async function createDatabase() {
    const newDatabase = await databasesStore.connectExistingDatabase({
      host: $host,
      port: $port,
      role: $role,
      password: $password,
      database: $databaseName,
      sample_data:
        getSampleSchemasFromInstallationSchemas($installationSchemas),
    });
    onSuccess(newDatabase);
  }
</script>

<div class="connect-db-form">
  <div class="field-group-horizontal">
    <div>
      <Field label={$_('host')} layout="stacked" field={host} />
    </div>
    <div>
      <Field
        label={$_('port')}
        layout="stacked"
        field={port}
        input={{ component: NumberInput }}
      />
    </div>
  </div>
  <Field
    label={$_('database_name')}
    layout="stacked"
    field={databaseName}
    help={$_('make_sure_database_exists')}
  />
  <Field
    label={$_('username')}
    layout="stacked"
    field={role}
    help={$_('user_needs_create_connect_privileges')}
  />
  <Field
    label={$_('password')}
    layout="stacked"
    field={password}
    input={{
      component: PasswordInput,
      props: { autocomplete: 'new-password' },
    }}
  />
  <FieldLayout>
    <InstallationSchemaSelector {installationSchemas} />
  </FieldLayout>

  <div use:portalToWindowFooter class="footer">
    <FormSubmit
      {form}
      catchErrors
      {onCancel}
      onProceed={createDatabase}
      proceedButton={{ label: $_('connect_database') }}
      cancelButton={{ label: $_('cancel') }}
    />
  </div>
</div>

<style>
  .field-group-horizontal {
    display: grid;
    grid-template-columns: 3fr 1fr;
    gap: 1rem;
    margin-bottom: 1rem;
  }
</style>
