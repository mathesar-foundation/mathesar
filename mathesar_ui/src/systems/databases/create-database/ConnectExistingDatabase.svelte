<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Help from '@mathesar/component-library/help/Help.svelte';
  import DocsLink from '@mathesar/components/DocsLink.svelte';
  import {
    FieldLayout,
    FormSubmit,
    makeForm,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Database } from '@mathesar/models/Database';
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
  const password = optionalField('');
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
  <Field label={$_('role_name')} layout="stacked" field={role}>
    <svelte:fragment slot="help">
      {$_('role_needs_create_connect_privileges')}
      <Help>
        <p>{$_('role_needs_create_connect_privileges_detail_1')}</p>
        <p>
          <RichText
            text={$_('role_needs_create_connect_privileges_detail_2')}
            let:slotName
            let:translatedArg
          >
            {#if slotName === 'italic'}
              <em>{translatedArg}</em>
            {:else if slotName === 'docsLink'}
              <DocsLink page="internalSchemas">{translatedArg}</DocsLink>
            {/if}
          </RichText>
        </p>
      </Help>
    </svelte:fragment>
  </Field>
  <Field
    label={$_('password')}
    layout="stacked"
    field={password}
    input={{
      component: PasswordInput,
      props: { autocomplete: 'new-password' },
    }}
  >
    <svelte:fragment slot="help">
      <RichText
        text={$_('connect_db_password_help')}
        let:slotName
        let:translatedArg
      >
        {#if slotName === 'docsLink'}
          <DocsLink page="storedRolePasswords">{translatedArg}</DocsLink>
        {/if}
      </RichText>
    </svelte:fragment>
  </Field>
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
