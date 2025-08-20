<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    type RawEphemeralDataForm,
    dataFormStructureVersion,
  } from '@mathesar/api/rpc/forms';
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
  import { TableStructure } from '@mathesar/stores/table-data';
  import { importVerifiedTables } from '@mathesar/stores/tables';
  import {
    ControlledModal,
    LabeledInput,
    type ModalController,
    ensureReadable,
  } from '@mathesar-component-library';

  import { processedColumnToRawDataFormField } from './utils';

  const schemaRouteContext = SchemaRouteContext.get();

  export let controller: ModalController;
  export let dataForm: DataForm | undefined = undefined;
  export let onClose: (() => void) | undefined = undefined;

  $: savedStructure = ensureReadable(dataForm?.structure);
  $: savedBaseTable = dataForm
    ? $importVerifiedTables.get(dataForm.baseTableOid)
    : undefined;

  $: name = requiredField($savedStructure?.name ?? '');
  $: description = optionalField($savedStructure?.description ?? '');
  $: baseTable = requiredField<Table | undefined>(savedBaseTable);
  $: form = makeForm({ name, description, baseTable });
  $: modalTitle = dataForm ? $_('edit_form_with_name') : $_('create_new_form');

  async function save(values: FilledFormValues<typeof form>) {
    if (dataForm) {
      await dataForm.updateNameAndDesc(values.name, values.description);
    } else {
      const tableStructure = new TableStructure(values.baseTable);
      const tableStructureStore =
        await tableStructure.getSubstanceOnceResolved();
      const tableStructureSubstance = tableStructureStore.resolvedValue;
      if (tableStructureSubstance) {
        const rawEpf: RawEphemeralDataForm = {
          name: values.name,
          description: values.description,
          base_table_oid: tableStructureSubstance.table.oid,
          schema_oid: tableStructureSubstance.table.schema.oid,
          database_id: tableStructureSubstance.table.schema.database.id,
          version: dataFormStructureVersion,
          associated_role_id: null,
          submit_message: null,
          submit_redirect_url: null,
          submit_button_label: null,
          fields: [...tableStructureSubstance.processedColumns.values()]
            .filter((pc) => !pc.column.default?.is_dynamic)
            .map((c, index) => processedColumnToRawDataFormField(c, index)),
        };
        await $schemaRouteContext.insertDataForm(rawEpf);
      }
    }
    controller.close();
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
        <Identifier>{$savedStructure?.name}</Identifier>
      {/if}
    </RichText>
  </span>
  <FieldLayout>
    <LabeledInput layout="stacked">
      <span slot="label">{$_('base_table')}</span>
      <SelectTableWithinCurrentSchema
        disabled={!!dataForm}
        autoSelect="none"
        bind:value={$baseTable}
      />
    </LabeledInput>
  </FieldLayout>
  <Field field={name} label={$_('name')} layout="stacked" />
  <Field field={description} label={$_('description')} layout="stacked" />
  <div slot="footer">
    <FormSubmit
      {form}
      proceedButton={{ label: $_('save') }}
      onProceed={save}
      onCancel={() => controller.close()}
    />
  </div>
</ControlledModal>
