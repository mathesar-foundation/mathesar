<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    FieldLayout,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import type { Database } from '@mathesar/models/Database';
  import { databasesStore } from '@mathesar/stores/databases';
  import { portalToWindowFooter } from '@mathesar-component-library';

  import {
    type InstallationSchema,
    getSampleSchemasFromInstallationSchemas,
  } from './createDatabaseUtils';
  import InstallationSchemaSelector from './InstallationSchemaSelector.svelte';

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
  <Field label={$_('database_name')} layout="stacked" field={databaseName} />

  <FieldLayout>
    <InstallationSchemaSelector {installationSchemas} />
  </FieldLayout>

  <div use:portalToWindowFooter class="footer">
    <FormSubmit
      {form}
      catchErrors
      {onCancel}
      onProceed={createDatabase}
      proceedButton={{ label: $_('create_database') }}
      cancelButton={{ label: $_('cancel') }}
    />
  </div>
</div>
