<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    FieldLayout,
    FormSubmit,
    makeForm,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import type { Database } from '@mathesar/models/Database';
  import { databasesStore } from '@mathesar/stores/databases';
  import { portalToWindowFooter } from '@mathesar-component-library';

  import DatabaseNicknameInput from '../common/DatabaseNicknameInput.svelte';

  import {
    type InstallationSchema,
    getSampleSchemasFromInstallationSchemas,
  } from './createDatabaseUtils';
  import InstallationSchemaSelector from './InstallationSchemaSelector.svelte';

  export let onCancel: () => void;
  export let onSuccess: (db: Database) => void;

  const databaseName = requiredField('');
  const nickname = optionalField<string | undefined>(undefined);
  const installationSchemas = requiredField<InstallationSchema[]>(['internal']);
  const form = makeForm({
    databaseName,
    nickname,
    installationSchemas,
  });

  async function createDatabase() {
    const newDatabase = await databasesStore.createNewDatabase({
      database: $databaseName,
      nickname: $nickname ?? null,
      sample_data:
        getSampleSchemasFromInstallationSchemas($installationSchemas),
    });
    onSuccess(newDatabase);
  }
</script>

<div class="create-db-form">
  <Field label={$_('database_name')} layout="stacked" field={databaseName} />

  <Field field={nickname} input={{ component: DatabaseNicknameInput }} />

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
