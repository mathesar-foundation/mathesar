<script lang="ts">
  import { some } from 'iter-tools';
  import { _ } from 'svelte-i18n';

  import type { SystemSchema } from '@mathesar/api/rpc/databases';
  import DocsLink from '@mathesar/components/DocsLink.svelte';
  import {
    Field,
    FieldLayout,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import type { Database } from '@mathesar/models/Database';
  import {
    type DatabaseDisconnectFn,
    databasesStore,
  } from '@mathesar/stores/databases';
  import {
    Checkbox,
    Fieldset,
    Help,
    LabeledInput,
    PasswordInput,
    RadioGroup,
    Tooltip,
    assertExhaustive,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  export let database: Database;
  export let disconnect: DatabaseDisconnectFn;
  export let cancel: () => void;

  const dropOptions = {
    keep: $_('keep_the_database'),
    drop: $_('drop_the_database'),
  };
  type DropOption = keyof typeof dropOptions;
  const dropOptionKeys = Object.keys(dropOptions) as DropOption[];
  function getDropOptionLabel(v: DropOption) {
    return dropOptions[v];
  }

  const dropOption = requiredField<DropOption>('keep');
  const removeSystemSchemas = requiredField(false);
  const removeTypesSchema = requiredField(false);
  const useRole = requiredField(false);
  const roleName = requiredField('');
  const rolePassword = requiredField('');

  $: ({ databases } = databasesStore);
  /**
   * True when the current database is the only database associated with its
   * containing server
   */
  $: isLastDbInServer = !some(
    (d) => d.id !== database.id && d.server.id === database.server.id,
    $databases.values(),
  );

  $: removeDbServer = requiredField(isLastDbInServer);

  $: form = makeForm(
    $removeSystemSchemas && $useRole ? { roleName, rolePassword } : {},
  );
  $: schemasToRemove = (() => {
    const schemas: SystemSchema[] = [];
    if ($removeSystemSchemas) {
      schemas.push('msar');
      schemas.push('__msar');
      if ($removeTypesSchema) {
        schemas.push('mathesar_types');
      }
    }
    return schemas;
  })();

  async function submit() {
    await disconnect({
      database,
      schemas_to_remove: schemasToRemove,
      role: $useRole ? { name: $roleName, password: $rolePassword } : undefined,
      disconnect_db_server: isLastDbInServer && $removeDbServer,
    });
  }
</script>

<div>
  <FieldLayout>
    {$_('database_disconnect_form_into')}
  </FieldLayout>

  <FieldLayout>
    <Fieldset label={$_('in_mathesar')} boxed>
      {#if isLastDbInServer}
        <FieldLayout>
          <LabeledInput layout="inline-input-first">
            <div slot="label">
              {$_('remove_stored_role_passwords')}
              <Help>
                <p>{$_('remove_stored_role_passwords_help_1')}</p>
                <ul>
                  <li>
                    <p>
                      <RichText
                        text={$_('remove_stored_role_passwords_help_checked')}
                        let:slotName
                        let:translatedArg
                      >
                        {#if slotName === 'bold'}
                          <b>{translatedArg}</b>
                        {/if}
                      </RichText>
                    </p>
                  </li>
                  <li>
                    <p>
                      <RichText
                        text={$_('remove_stored_role_passwords_help_unchecked')}
                        let:slotName
                        let:translatedArg
                      >
                        {#if slotName === 'bold'}
                          <b>{translatedArg}</b>
                        {/if}
                      </RichText>
                    </p>
                  </li>
                </ul>
                <p>
                  <RichText
                    text={$_('see_docs_for_stored_role_password_help')}
                    let:slotName
                    let:translatedArg
                  >
                    {#if slotName === 'docsLink'}
                      <DocsLink page="storedRolePasswords">
                        {translatedArg}
                      </DocsLink>
                    {/if}
                  </RichText>
                </p>
              </Help>
            </div>
            <Checkbox bind:checked={$removeDbServer} />
          </LabeledInput>
        </FieldLayout>
      {/if}

      <FieldLayout>
        <Tooltip allowHover placements={['left', 'bottom', 'top']}>
          <svelte:fragment slot="trigger">
            <LabeledInput layout="inline-input-first">
              <div slot="label">{$_('remove_metadata')}</div>
              <Checkbox checked disabled />
            </LabeledInput>
          </svelte:fragment>
          <svelte:fragment slot="content">
            <p>
              <RichText
                text={$_('remove_metadata_field_help')}
                let:slotName
                let:translatedArg
              >
                {#if slotName === 'explorationsLink'}
                  <DocsLink page="metadata">{translatedArg}</DocsLink>
                {/if}
                {#if slotName === 'metadataLink'}
                  <DocsLink page="metadata">{translatedArg}</DocsLink>
                {/if}
              </RichText>
            </p>
            <p>{$_('this_behavior_is_not_configurable')}</p>
          </svelte:fragment>
        </Tooltip>
      </FieldLayout>
    </Fieldset>
  </FieldLayout>

  <FieldLayout>
    <Fieldset label={$_('in_postgres')} boxed>
      <FieldLayout>
        <RadioGroup
          options={dropOptionKeys}
          getRadioLabel={getDropOptionLabel}
          bind:value={$dropOption}
          isInline
        />
      </FieldLayout>
      {#if $dropOption === 'drop'}
        <FieldLayout>
          <WarningBox>
            <RichText
              text={$_('drop_not_yet_implemented')}
              let:slotName
              let:translatedArg
            >
              {#if slotName === 'link'}
                <a
                  href="https://github.com/mathesar-foundation/mathesar/issues/3862"
                >
                  {translatedArg}
                </a>
              {/if}
            </RichText>
          </WarningBox>
        </FieldLayout>
      {:else if $dropOption === 'keep'}
        <FieldLayout>
          <LabeledInput layout="inline-input-first">
            <div slot="label">
              {$_('remove_internal_schemas')}
              <Help>
                <p>{$_('remove_internal_schemas_help_1')}</p>
                <p>{$_('remove_internal_schemas_help_2')}</p>
                <p>
                  <RichText
                    text={$_('remove_internal_schemas_help_3')}
                    let:slotName
                    let:translatedArg
                  >
                    {#if slotName === 'link'}
                      <DocsLink page="internalSchemas">
                        {translatedArg}
                      </DocsLink>
                    {/if}
                  </RichText>
                </p>
              </Help>
            </div>
            <Checkbox bind:checked={$removeSystemSchemas} />
          </LabeledInput>
        </FieldLayout>
        {#if $removeSystemSchemas}
          <div class="indent">
            <FieldLayout>
              <LabeledInput layout="inline-input-first">
                <div slot="label">
                  {$_('remove_types_schema')}
                  <Help>
                    <p>{$_('remove_types_schema_help_1')}</p>
                    <p>{$_('remove_types_schema_help_2')}</p>
                    <p>{$_('remove_types_schema_help_3')}</p>
                    <p>{$_('remove_types_schema_help_4')}</p>
                    <p>
                      <RichText
                        text={$_('remove_types_schema_help_5')}
                        let:slotName
                        let:translatedArg
                      >
                        {#if slotName === 'link'}
                          <DocsLink page="dataTypes">
                            {translatedArg}
                          </DocsLink>
                        {/if}
                      </RichText>
                    </p>
                  </Help>
                </div>
                <Checkbox bind:checked={$removeTypesSchema} />
              </LabeledInput>
            </FieldLayout>
            <FieldLayout>
              <LabeledInput layout="inline-input-first">
                <div slot="label">
                  {$_('use_role_to_remove_schemas')}
                  <Help>{$_('use_role_to_remove_schemas_help')}</Help>
                </div>
                <Checkbox bind:checked={$useRole} />
              </LabeledInput>
            </FieldLayout>
            {#if $useRole}
              <div class="indent">
                <Field
                  label={$_('role_name')}
                  layout="stacked"
                  field={roleName}
                />
                <Field
                  label={$_('role_password')}
                  layout="stacked"
                  field={rolePassword}
                  input={{
                    component: PasswordInput,
                    props: { autocomplete: 'off' },
                  }}
                />
              </div>
            {/if}
          </div>
        {/if}
      {:else}
        {assertExhaustive($dropOption)}
      {/if}
    </Fieldset>
  </FieldLayout>
</div>

<div use:portalToWindowFooter>
  <FormSubmit
    {form}
    catchErrors
    onCancel={() => {
      form.reset();
      cancel();
    }}
    canProceed={$dropOption === 'keep'}
    onProceed={submit}
    proceedButton={{ label: $_('disconnect') }}
    cancelButton={{ label: $_('cancel') }}
  />
</div>

<style>
  .indent {
    margin: 1rem 0 0 1.4rem;
  }
</style>
