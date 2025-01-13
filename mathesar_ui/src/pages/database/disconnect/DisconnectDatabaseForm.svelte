<script lang="ts">
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
  import type { DatabaseDisconnectFn } from '@mathesar/stores/databases';
  import {
    Checkbox,
    Help,
    LabeledInput,
    PasswordInput,
    RadioGroup,
    assertExhaustive,
    portalToWindowFooter,
  } from '@mathesar-component-library';

  export let database: Database;
  export let disconnect: DatabaseDisconnectFn;
  export let cancel: () => void;

  const dropOptions = {
    keep: $_('keep_the_database_in_pg'),
    drop: $_('drop_the_database_from_pg'),
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
    });
  }
</script>

<div>
  <FieldLayout>
    {$_('database_disconnect_form_into')}
  </FieldLayout>

  <FieldLayout>
    <RadioGroup
      label={$_('outside_of_mathesar')}
      options={dropOptionKeys}
      getRadioLabel={getDropOptionLabel}
      bind:value={$dropOption}
      boxed
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
          </div>
        {/if}
      </div>
    {/if}
  {:else}
    {assertExhaustive($dropOption)}
  {/if}
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
