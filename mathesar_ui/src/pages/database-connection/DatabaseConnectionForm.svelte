<script lang="ts">
  import { PasswordInput, TextInput } from '@mathesar/component-library';
  import databaseConnectionApi from '@mathesar/api/databaseConnection';
  import {
    FormSubmit,
    makeForm,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import { databases } from '@mathesar/stores/databases';
  import GridFormInput from '@mathesar/components/form/GridFormInput.svelte';
  import type { Database } from '@mathesar/AppTypes';
  import { extractDetailedFieldBasedErrors } from '@mathesar/api/utils/errors';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import DocsLink from '@mathesar/components/DocsLink.svelte';

  let databaseNameProp: string | undefined = undefined;
  export { databaseNameProp as databaseName };
  export let onCreate: ((db: Database) => Promise<void>) | undefined =
    undefined;
  export let onUpdate: (() => Promise<void>) | undefined = undefined;

  $: database = $databases.data?.find((db) => db.name === databaseNameProp);
  $: isNewConnection = !database;

  $: connectionName = requiredField(database?.name ?? '');
  $: databaseName = requiredField(database?.db_name ?? '');
  $: username = requiredField(database?.username ?? '');
  $: host = requiredField(database?.host ?? '');
  $: port = requiredField(database?.port ?? '5432', [
    (value) =>
      !Number.isNaN(+value)
        ? { type: 'valid' }
        : { type: 'invalid', errorMsg: 'Port should be a valid number' },
  ]);

  // There will be no prefill value even in the case of editing
  $: password = isNewConnection ? requiredField('') : optionalField('');
  $: hasPasswordChangedStore = password.hasChanges;
  $: hasPasswordChanged = $hasPasswordChangedStore;

  $: formFields = {
    connectionName,
    databaseName,
    username,
    host,
    port,
    password,
  };
  $: form = makeForm(formFields);
  $: ({ isSubmitting } = form);

  async function addNewDatabaseConnection() {
    const formValues = $form.values;
    return databaseConnectionApi.add({
      name: formValues.connectionName,
      db_name: formValues.databaseName,
      username: formValues.username,
      host: formValues.host,
      port: formValues.port,
      password: formValues.password,
    });
  }

  async function updateDatabaseConnection() {
    const formValues = $form.values;
    if (database) {
      return databaseConnectionApi.update(database?.id, {
        db_name: formValues.databaseName,
        username: formValues.username,
        host: formValues.host,
        port: formValues.port,
        ...(hasPasswordChanged ? { password: formValues.password } : undefined),
      });
    }
    throw new Error(
      '[updateDatabaseConnection] called but no database found to edit.',
    );
  }

  async function saveConnectionDetails() {
    if (isNewConnection) {
      const newDatabase = await addNewDatabaseConnection();
      await onCreate?.(newDatabase);
    } else {
      await updateDatabaseConnection();
      form.reset();
      await onUpdate?.();
    }
  }

  function getErrorMessages(e: unknown) {
    type FieldKey = keyof typeof formFields;
    const { commonErrors, fieldSpecificErrors } =
      extractDetailedFieldBasedErrors<FieldKey>(e, {
        name: 'connectionName',
        db_name: 'databaseName',
      });
    for (const [fieldKey, errors] of fieldSpecificErrors) {
      const field = form.fields[fieldKey];
      if (field) {
        field.serverErrors.set(errors);
      } else {
        /**
         * Incase an error occurs when the server returned field
         * is not part of the form.
         * Ideally this should never happen.
         */
        commonErrors.push(...errors);
      }
    }
    return commonErrors;
  }
</script>

<div class="db-connection-form">
  <GridFormInput
    label="Connection Name *"
    field={connectionName}
    input={{
      component: TextInput,
      props: { disabled: !isNewConnection || $isSubmitting },
    }}
    help="Used for internal identification."
  />

  <GridFormInput
    label="Database Name *"
    field={databaseName}
    input={{ component: TextInput }}
  />

  <GridFormInput
    bypassRow
    label="Host *"
    field={host}
    input={{ component: TextInput }}
  />

  <GridFormInput
    bypassRow
    label="Port *"
    field={port}
    input={{ component: TextInput }}
  />

  <!-- TODO: Add link in help -->
  <GridFormInput
    label="Username *"
    field={username}
    input={{ component: TextInput }}
  >
    <!-- TODO: Add link -->
    <slot slot="help">
      The user will need to have CONNECT and CREATE privileges on the database.
      <DocsLink path="/">Why is this needed?</DocsLink>.
    </slot>
  </GridFormInput>

  <GridFormInput
    label={isNewConnection ? 'Password *' : 'Password'}
    field={password}
    input={{
      component: PasswordInput,
      props: { autocomplete: 'new-password' },
    }}
  />
</div>
<div class="footer">
  {#if isNewConnection}
    <!-- TODO: Add link -->
    <WarningBox>
      For Mathesar to function properly, we will add a number of functions and
      types to this database. They will all be namespaced into
      <DocsLink path="/">Mathesar-specific schemas</DocsLink> for safety and organization.
    </WarningBox>
  {/if}
  <FormSubmit
    {form}
    catchErrors
    onProceed={saveConnectionDetails}
    proceedButton={{
      label: isNewConnection ? 'Add Connection' : 'Update Connection',
    }}
    cancelButton={{ label: 'Discard Changes' }}
    {getErrorMessages}
    initiallyHidden={!!database}
    hasCancelButton={!!database}
  />
</div>

<style>
  .db-connection-form {
    display: grid;
    grid-template-columns: auto 1fr auto 1fr;
  }
  :global(.db-connection-form .right:not(.db-connection-form > .right)) {
    grid-column: 2/5;
  }
  :global(.db-connection-form > .right, .db-connection-form > .left) {
    margin-bottom: var(--size-large);
    margin-top: var(--size-large);
  }
  .footer {
    margin-top: var(--size-base);
    --form-submit-margin: var(--size-base) 0 0 0;
  }
</style>
