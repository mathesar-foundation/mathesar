<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { portalToWindowFooter } from '@mathesar-component-library';
  import {
    requiredField,
    FormSubmit,
    makeForm,
  } from '@mathesar/components/form';
  import Form from '@mathesar/components/Form.svelte';
  import FormField from '@mathesar/components/FormField.svelte';
  import Field from '@mathesar/components/form/Field.svelte';
  import type { Database } from '@mathesar/api/rpc/databases';
  import { databasesStore } from '@mathesar/stores/databases';
  import InstallationSchemaSelector from './InstallationSchemaSelector.svelte';
  import {
    type InstallationSchema,
    getSampleSchemasFromInstallationSchemas,
  } from './createDatabaseUtils';

  export let onCancel: () => void;
  export let onSuccess: (db: Database) => void;

  const databaseName = requiredField('');
  const installationSchemas = requiredField<InstallationSchema[]>(['internal']);
  const form = makeForm({ databaseName, installationSchemas });

  async function createDatabase() {
    const newDatabase = await databasesStore.createNewDatabase({
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
      <Field label={$_('name')} layout="stacked" field={databaseName} />
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
