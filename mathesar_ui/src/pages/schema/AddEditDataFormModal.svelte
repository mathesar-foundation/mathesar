<script lang="ts">
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
  import SelectTableWithinCurrentSchema from '@mathesar/components/SelectTableWithinCurrentSchema.svelte';
  import { SchemaRouteContext } from '@mathesar/contexts/SchemaRouteContext';
  import type { DataForm } from '@mathesar/models/DataForm';
  import type { Table } from '@mathesar/models/Table';
  import { getDataFormPageUrl } from '@mathesar/routes/urls';
  import { TableStructure } from '@mathesar/stores/table-data';
  import { importVerifiedTables } from '@mathesar/stores/tables';
  import { tableStructureSubstanceRawEphemeralForm } from '@mathesar/systems/data-forms';
  import {
    ControlledModal,
    LabeledInput,
    type ModalController,
    ensureReadable,
  } from '@mathesar-component-library';

  const schemaRouteContext = SchemaRouteContext.get();

  export let controller: ModalController;
  export let dataForm: DataForm | undefined = undefined;

  $: savedName = ensureReadable(dataForm?.name ?? '');
  $: savedDescription = ensureReadable(dataForm?.description ?? '');
  $: savedBaseTable = dataForm
    ? $importVerifiedTables.get(dataForm.baseTableOId)
    : undefined;

  $: name = requiredField($savedName ?? '');
  $: description = optionalField($savedDescription ?? '');
  $: sourceTable = requiredField<Table | undefined>(savedBaseTable);
  $: form = makeForm({ name, description, sourceTable });

  $: tableStructureStore = $sourceTable
    ? (() => {
        const table = $sourceTable;
        return new TableStructure(table).asyncStore;
      })()
    : ensureReadable(undefined);

  async function save(values: FilledFormValues<typeof form>) {
    let savedDataForm: DataForm | undefined;
    if (dataForm) {
      savedDataForm = await dataForm.replaceDataForm({
        ...dataForm.toRawDataForm(),
        name: values.name,
        description: values.description,
      });
    } else {
      const tableStructure = new TableStructure(values.sourceTable);
      const tableStructureSubstance = await tableStructure.asyncStore.tick();
      if (tableStructureSubstance.resolvedValue) {
        const rawEpf = tableStructureSubstanceRawEphemeralForm(
          tableStructureSubstance.resolvedValue,
        );
        savedDataForm = await $schemaRouteContext.insertDataForm({
          ...rawEpf,
          name: values.name,
          description: values.description,
        });
      }
    }
    controller.close();
    if (savedDataForm) {
      router.goto(
        getDataFormPageUrl(
          savedDataForm.schema.database.id,
          savedDataForm.schema.oid,
          savedDataForm.id,
        ),
      );
    }
  }
</script>

<ControlledModal {controller} on:close={form.reset}>
  <span slot="title">{$_('create_new_table')}</span>
  <Field field={name} label={$_('name')} layout="stacked" />
  <Field field={description} label={$_('description')} layout="stacked" />
  <FieldLayout>
    <LabeledInput layout="stacked">
      <span slot="label">{$_('source_table_for_form')}</span>
      <SelectTableWithinCurrentSchema
        disabled={$tableStructureStore?.isLoading || !!dataForm}
        autoSelect="none"
        bind:value={$sourceTable}
      />
    </LabeledInput>
  </FieldLayout>
  <div slot="footer">
    <FormSubmit {form} onProceed={save} onCancel={() => controller.close()} />
  </div>
</ControlledModal>
