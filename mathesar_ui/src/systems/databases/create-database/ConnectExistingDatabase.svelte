<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Database } from '@mathesar/api/rpc/databases';
  import {
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import Form from '@mathesar/components/Form.svelte';
  import FormField from '@mathesar/components/FormField.svelte';
  import { databasesStore } from '@mathesar/stores/databases';
  import {
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
  const form = makeForm({ databaseName, installationSchemas });

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

<div class="create-db-form">
  <Form>
    <FormField>
      <Field label={$_('host')} layout="stacked" field={host} />
    </FormField>

    <FormField>
      <Field label={$_('port')} layout="stacked" field={port} />
    </FormField>

    <FormField>
      <Field label={$_('name')} layout="stacked" field={databaseName} />
    </FormField>

    <FormField>
      <Field label={$_('username')} layout="stacked" field={role} />
    </FormField>

    <FormField>
      <Field
        label={$_('password')}
        layout="stacked"
        field={password}
        input={{ component: PasswordInput }}
      />
    </FormField>

    <FormField>
      <InstallationSchemaSelector {installationSchemas} />
    </FormField>
  </Form>

  <div use:portalToWindowFooter class="footer">
    <FormSubmit
      {form}
      catchErrors
      {onCancel}
      onProceed={createDatabase}
      proceedButton={{ label: $_('add_connection') }}
      cancelButton={{ label: $_('cancel') }}
    />
  </div>
</div>
