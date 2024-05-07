<script lang="ts">
  import { map } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import {
    type CommonCreationProps,
    type Connection,
    type SampleDataSchemaIdentifier,
    sampleDataOptions,
  } from '@mathesar/api/rest/connections';
  import Checkbox from '@mathesar/component-library/checkbox/Checkbox.svelte';
  import LabeledInput from '@mathesar/component-library/labeled-input/LabeledInput.svelte';
  import Select from '@mathesar/component-library/select/Select.svelte';
  import {
    FormSubmit,
    makeForm,
    requiredField,
    uniqueWith,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import FieldHelp from '@mathesar/components/form/FieldHelp.svelte';
  import {
    GridForm,
    GridFormDivider,
    GridFormLabelRow,
  } from '@mathesar/components/grid-form';
  import { connectionsStore } from '@mathesar/stores/databases';
  import { toast } from '@mathesar/stores/toast';
  import { getAvailableName } from '@mathesar/utils/db';
  import {
    CheckboxGroup,
    NumberInput,
    PasswordInput,
    RadioGroup,
    defined,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  import GeneralConnection from './GeneralConnection.svelte';
  import {
    generalConnections,
    getConnectionReference,
    getUsername,
    pickDefaultGeneralConnection,
  } from './generalConnections';

  interface CredentialsStrategy {
    /** We want to reuse the credentials from a known connection */
    reuse: boolean;
    /** The user can modify the strategy */
    modifiable: boolean;
  }
  function getCredentialsStrategyLabel(s: CredentialsStrategy) {
    return s.reuse
      ? $_('reuse_credentials_from_known_connection')
      : $_('enter_new_credentials');
  }

  type InstallationSchema = SampleDataSchemaIdentifier | 'internal';
  const installationSchemaOptions: InstallationSchema[] = [
    'internal',
    ...sampleDataOptions,
  ];
  const installationSchemaLabels: Record<InstallationSchema, string> = {
    // These strings are not translated because these are the names that will
    // appear in the Mathesar UI after installation.
    internal: 'mathesar_types, __msar, msar',
    library_management: 'Library Management',
    movie_collection: 'Movie Collection',
  };
  const installationSchemaHelp: Record<InstallationSchema, string> = {
    internal: $_('internal_schema_help'),
    library_management: $_('sample_data_library_help'),
    movie_collection: $_('sample_data_movies_help'),
  };

  export let onCancel: () => void;
  export let onSuccess: (c: Connection) => void;

  $: availableConnectionsToReuse = $generalConnections;
  $: defaultConnectionToReuse =
    pickDefaultGeneralConnection($generalConnections);
  $: namedConnections = connectionsStore.connections;
  $: connectionNames = new Set(map(([, c]) => c.nickname, $namedConnections));
  $: someUserDbConnectionsExist = $generalConnections.some(
    (c) => c.type === 'user_database',
  );
  $: defaultDatabaseName = someUserDbConnectionsExist ? '' : 'mathesar';
  $: credentialsStrategy = requiredField<CredentialsStrategy>(
    defaultConnectionToReuse
      ? { reuse: true, modifiable: true }
      : { reuse: false, modifiable: false },
  );
  $: databaseName = requiredField(defaultDatabaseName);
  $: createDatabase = requiredField(true);
  $: installationSchemas = requiredField<InstallationSchema[]>(['internal']);
  $: connectionNickname = requiredField('', [uniqueWith(connectionNames)]);
  $: connectionToReuse = requiredField(defaultConnectionToReuse);
  $: host = requiredField('localhost');
  $: port = requiredField(5432);
  $: user = requiredField('');
  $: password = requiredField('');
  $: commonFields = { databaseName, installationSchemas, connectionNickname };
  $: allFields = $credentialsStrategy.reuse
    ? { ...commonFields, connectionToReuse, createDatabase }
    : { ...commonFields, host, port, user, password };
  $: form = makeForm(allFields);
  $: canCreateDb = $credentialsStrategy.reuse;
  $: databaseNameHelp = canCreateDb
    ? undefined
    : $_('this_database_must_exist_already');
  $: databaseCreationUser = $credentialsStrategy.reuse
    ? defined($connectionToReuse, getUsername)
    : undefined;

  function handleNewDatabaseName(newDatabaseName: string) {
    $connectionNickname = getAvailableName(newDatabaseName, connectionNames);
  }
  $: handleNewDatabaseName($databaseName);

  function create(): Promise<Connection> {
    const commonProps: CommonCreationProps = {
      database_name: $databaseName,
      sample_data: sampleDataOptions.filter((o) =>
        $installationSchemas.includes(o),
      ),
      nickname: $connectionNickname,
    };
    if ($credentialsStrategy.reuse) {
      const connection = $connectionToReuse;
      if (!connection) {
        throw new Error('Bug: $connectionToReuse is undefined');
      }
      const connectionReference = getConnectionReference(connection);
      const connectionId =
        connectionReference.connection_type === 'user_database'
          ? connectionReference.id
          : undefined;
      return connectionsStore.createFromKnownConnection({
        database: commonProps.database_name,
        nickname: commonProps.nickname,
        sample_data: commonProps.sample_data,
        connection_id: connectionId,
        create_db: $createDatabase,
      });
    }
    return connectionsStore.createFromScratch({
      database: commonProps.database_name,
      nickname: commonProps.nickname,
      sample_data: commonProps.sample_data,
      host: $host,
      port: $port,
      user: $user,
      password: $password,
    });
  }

  async function saveConnectionDetails() {
    try {
      const connection = await create();
      onSuccess(connection);
      toast.success($_('connection_added_successfully'));
    } catch (e) {
      toast.fromError(e);
    }
  }
</script>

<div class="db-connection-form">
  <GridForm>
    {#if $credentialsStrategy.modifiable}
      <div>{$_('database_server_credentials')}</div>
      <div>
        <RadioGroup
          bind:value={$credentialsStrategy}
          ariaLabel={$_('database_server_credentials')}
          options={[
            { reuse: true, modifiable: true },
            { reuse: false, modifiable: true },
          ]}
          valuesAreEqual={(a, b) => a?.reuse === b?.reuse}
          getRadioLabel={getCredentialsStrategyLabel}
        />
      </div>
    {/if}

    {#if $credentialsStrategy.reuse}
      <GridFormLabelRow label={$_('known_connection')}>
        <Select
          bind:value={$connectionToReuse}
          options={availableConnectionsToReuse}
          getLabel={(generalConnection) => ({
            component: GeneralConnection,
            props: { generalConnection },
          })}
        />
        <FieldHelp>
          {$_('the_credentials_will_be_copied_from_this_connection')}
        </FieldHelp>
      </GridFormLabelRow>
    {:else}
      <GridFormLabelRow label={$_('host_name')}>
        <div class="host-and-port">
          <Field field={host} />
          <Field
            field={port}
            input={{ component: NumberInput, props: { style: 'width: 8ch;' } }}
            label={$_('port')}
          />
        </div>
      </GridFormLabelRow>

      <GridFormLabelRow label={$_('user_name')}>
        <Field field={user} help={$_('existing_pg_user_privileges_help')} />
      </GridFormLabelRow>

      <GridFormLabelRow label={$_('password')}>
        <Field
          field={password}
          input={{ component: PasswordInput }}
          help={$_('password_encryption_help')}
        />
      </GridFormLabelRow>
    {/if}

    <GridFormDivider />

    <GridFormLabelRow label={$_('database_name')}>
      <div>
        <Field field={databaseName} help={databaseNameHelp} />
      </div>
      {#if canCreateDb}
        <div class="create-db-checkbox-field">
          <LabeledInput
            label={$_('create_db_if_not_exists')}
            layout="inline-input-first"
            help={$_('operation_requires_pg_user_have_createdb', {
              values: { username: databaseCreationUser },
            })}
          >
            <Checkbox bind:checked={$createDatabase} />
          </LabeledInput>
        </div>
      {/if}
    </GridFormLabelRow>

    <GridFormDivider />

    <div>{$_('schemas_to_install')}</div>
    <div>
      <CheckboxGroup
        bind:values={$installationSchemas}
        ariaLabel={$_('schemas_to_install')}
        options={installationSchemaOptions}
        getCheckboxLabel={(o) => installationSchemaLabels[o]}
        getCheckboxHelp={(o) => installationSchemaHelp[o]}
        getCheckboxDisabled={(o) => o === 'internal'}
      />
    </div>

    <GridFormDivider />

    <GridFormLabelRow label={$_('connection_nickname')}>
      <Field field={connectionNickname} help={$_('connection_nickname_help')} />
    </GridFormLabelRow>
  </GridForm>

  <div use:portalToWindowFooter class="footer">
    <FormSubmit
      {form}
      catchErrors
      {onCancel}
      onProceed={saveConnectionDetails}
      proceedButton={{ label: $_('add_connection') }}
      cancelButton={{ label: $_('cancel') }}
    />
  </div>
</div>

<style>
  .db-connection-form {
    --form-submit-margin: 1rem 0 0 0;
  }
  .host-and-port {
    display: grid;
    grid-template: 1fr / 1fr auto;
    gap: 1rem;
  }
  .host-and-port > :global(*) {
    margin: 0;
  }
  .create-db-checkbox-field {
    margin-top: 1rem;
  }
</style>
