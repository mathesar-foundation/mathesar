<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    Field,
    FormSubmit,
    makeForm,
    requiredField,
  } from '@mathesar/components/form';
  import { iconAddNew } from '@mathesar/icons';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import { columnNameIsAvailable } from '@mathesar/utils/columnUtils';
  import { Dropdown, Icon, Spinner } from '@mathesar-component-library';

  import ColumnTypeSelector from './ColumnTypeSelector.svelte';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);
  $: ({ columns } = columnsDataStore);

  $: columnName = requiredField('', [columnNameIsAvailable($columns)]);
  const columnType = requiredField<string | undefined>(undefined);
  $: form = makeForm({ columnName, columnType });
  $: ({ isSubmitting } = form);

  async function addColumn(closeDropdown: () => void) {
    await columnsDataStore.add({
      name: $columnName,
      type: $columnType,
    });
    closeDropdown();
  }
</script>

<Dropdown
  closeOnInnerClick={false}
  triggerAppearance="plain"
  showArrow={false}
  ariaLabel={$_('new_column')}
  on:close={form.reset}
  disabled={$isSubmitting}
>
  <svelte:fragment slot="trigger">
    {#if $isSubmitting}
      <Spinner />
    {:else}
      <Icon class="opt" {...iconAddNew} size="0.9em" />
    {/if}
  </svelte:fragment>
  <div slot="content" class="new-column-dropdown" let:close>
    <Field field={columnName} label={$_('column_name')} layout="stacked" />
    <Field
      field={columnType}
      input={{ component: ColumnTypeSelector }}
      label={$_('select_type')}
      layout="stacked"
    />
    <div class="submit">
      <FormSubmit
        {form}
        proceedButton={{ label: $_('add') }}
        onProceed={() => addColumn(close)}
        onCancel={close}
        catchErrors
      />
    </div>
  </div>
</Dropdown>

<style lang="scss">
  .new-column-dropdown {
    padding: var(--size-small);
    overflow: hidden;
    width: 16em;

    .submit {
      margin-top: 1em;
    }
  }
</style>
