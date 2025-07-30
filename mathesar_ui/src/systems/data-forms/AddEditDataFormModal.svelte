<script lang="ts">
  import { get } from 'svelte/store';
  import { _ } from 'svelte-i18n';
  import { router } from 'tinro';

  import {
    FieldLayout,
    type FilledFormValues,
    FormSubmit,
    makeForm,
    optionalField,
    requiredField,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import type { DataForm } from '@mathesar/models/DataForm';
  import type { Table } from '@mathesar/models/Table';
  import { getDataFormPageUrl } from '@mathesar/routes/urls';
  import { TableStructure } from '@mathesar/stores/table-data';
  import { importVerifiedTables } from '@mathesar/stores/tables';
  import {
    ControlledModal,
    LabeledInput,
    type ModalController,
    ensureReadable,
  } from '@mathesar-component-library';

  import { tableStructureSubstanceRawEphemeralForm } from './data-form-utilities/transformers';

  const schemaRouteContext = SchemaRouteContext.get();

  export let controller: ModalController;
  export let dataForm: DataForm | undefined = undefined;
  export let onClose: (() => void) | undefined = undefined;

  $: savedName = ensureReadable(dataForm?.name ?? '');
  $: savedDescription = ensureReadable(dataForm?.description ?? '');
  $: savedBaseTable = dataForm
    ? $importVerifiedTables.get(dataForm.baseTableOId)
    : undefined;

  $: name = requiredField($savedName ?? '');
  $: description = optionalField($savedDescription ?? '');
  $: sourceTable = requiredField<Table | undefined>(savedBaseTable);
  $: form = makeForm({ name, description, sourceTable });
  $: modalTitle = dataForm ? $_('edit_form_with_name') : $_('create_new_form');

  $: sourceTableStructure = $sourceTable
    ? new TableStructure($sourceTable)
    : undefined;
  $: isSourceTableStructureLoading = sourceTableStructure
    ? sourceTableStructure.isLoading
    : ensureReadable(false);

  async function save(values: FilledFormValues<typeof form>) {
    let newDataForm: DataForm | undefined;
    if (dataForm) {
      await dataForm.replaceDataForm({
        ...get(dataForm.toRawDataFormStore()),
        name: values.name,
        description: values.description,
      });
    } else {
      const tableStructure = new TableStructure(values.sourceTable);
      const tableStructureSubstance = await tableStructure.tick();
      if (tableStructureSubstance.resolvedValue) {
        const rawEpf = tableStructureSubstanceRawEphemeralForm(
          tableStructureSubstance.resolvedValue,
        );
        newDataForm = await $schemaRouteContext.insertDataForm({
          ...rawEpf,
          name: values.name,
          description: values.description,
        });
      }
    }
    controller.close();
    if (newDataForm) {
      router.goto(
        getDataFormPageUrl(
          newDataForm.schema.database.id,
          newDataForm.schema.oid,
          newDataForm.id,
        ),
      );
    }
  }
</script>

<ControlledModal
  {controller}
  on:close={() => {
    form.reset();
    onClose?.();
  }}
>
  <span slot="title">
    <RichText text={modalTitle} let:slotName>
      {#if slotName === 'formName'}
        <Identifier>{$savedName}</Identifier>
      {/if}
    </RichText>
  </span>
  <Field field={name} label={$_('name')} layout="stacked" />
  <Field field={description} label={$_('description')} layout="stacked" />
  <FieldLayout>
    <LabeledInput layout="stacked">
      <span slot="label">{$_('source_table_for_form')}</span>
      <SelectTableWithinCurrentSchema
        disabled={$isSourceTableStructureLoading || !!dataForm}
        autoSelect="none"
        bind:value={$sourceTable}
      />
    </LabeledInput>
  </FieldLayout>
  <div slot="footer">
    <FormSubmit
      {form}
      proceedButton={{ label: $_('save') }}
      onProceed={save}
      onCancel={() => controller.close()}
    />
  </div>
</ControlledModal>
