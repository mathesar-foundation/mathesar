<script lang="ts">
  import { _ } from 'svelte-i18n';

  import CollapsibleFieldset from '@mathesar/components/CollapsibleFieldset.svelte';
  import {
    FieldLayout,
    type FilledFormValues,
    FormSubmit,
    makeForm,
    optionalField,
    requiredField,
    uniqueWith,
  } from '@mathesar/components/form';
  import Field from '@mathesar/components/form/Field.svelte';
  import {
    type NewPkColumnType,
    SelectNewPkColumnType,
  } from '@mathesar/components/select-new-pk-column-type';
  import type { Schema } from '@mathesar/models/Schema';
  import { createTable } from '@mathesar/stores/tables';
  import { portalToWindowFooter } from '@mathesar-component-library';

  export let close: () => void;
  export let schema: Schema;
  export let existingTableNames: Set<string>;

  function getInitialName() {
    function makeName(i: number): string {
      const name = `${$_('table')} ${i}`;
      return existingTableNames.has(name) ? makeName(i + 1) : name;
    }
    return makeName(1);
  }

  $: name = requiredField(getInitialName(), [
    uniqueWith(existingTableNames, $_('table_name_already_exists')),
  ]);
  $: description = optionalField('');
  $: pkColumnName = requiredField('id');
  $: pkColumnType = requiredField<NewPkColumnType>('identity');
  $: form = makeForm({ name, description, pkColumnName, pkColumnType });

  async function save(values: FilledFormValues<typeof form>) {
    await createTable({
      schema,
      name: values.name,
      description: values.description,
      pkColumn: {
        name: values.pkColumnName,
        type: values.pkColumnType,
      },
    });
    close();
  }
</script>

<Field field={name} label={$_('name')} layout="stacked" />
<Field field={description} label={$_('description')} layout="stacked" />
<FieldLayout>
  <CollapsibleFieldset>
    <span slot="label">{$_('primary_key_column')}</span>
    <Field field={pkColumnName} label={$_('column_name')} layout="stacked" />
    <Field
      field={pkColumnType}
      layout="stacked"
      label={$_('column_type')}
      input={{ component: SelectNewPkColumnType }}
    />
  </CollapsibleFieldset>
</FieldLayout>

<div use:portalToWindowFooter>
  <FormSubmit {form} onProceed={save} onCancel={close} />
</div>
