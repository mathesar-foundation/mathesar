<script lang="ts">
  import { Dropdown, Icon, Spinner } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import {
    requiredField,
    makeForm,
    Field,
    FormSubmit,
  } from '@mathesar/components/form';
  import { columnNameIsAvailable } from '@mathesar/utils/columnUtils';
  import { iconAddNew } from '@mathesar/icons';
  import ColumnTypeSelector from './ColumnTypeSelector.svelte';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);
  $: ({ columns } = columnsDataStore);

  $: columnName = requiredField('', [columnNameIsAvailable($columns)]);
  const columnType = requiredField<string | undefined>(undefined);
  $: form = makeForm({ columnName, columnType });
  $: ({ isSubmitting } = form);

  async function addColumn(closeDropdown: () => void) {
    const newColumn = {
      name: $columnName,
      type: $columnType,
      nullable: true,
      primary_key: false,
    };
    await columnsDataStore.add(newColumn);
    closeDropdown();
  }
</script>

<Dropdown
  closeOnInnerClick={false}
  triggerAppearance="secondary"
  showArrow={false}
  ariaLabel="New Column"
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
    <Field field={columnName} label="Column Name" layout="stacked" />
    <Field
      field={columnType}
      input={{ component: ColumnTypeSelector }}
      label="Select Type"
      layout="stacked"
    />
    <div class="submit">
      <FormSubmit
        {form}
        proceedButton={{ label: 'Add' }}
        onProceed={() => addColumn(close)}
        onCancel={close}
        catchErrors
      />
    </div>
  </div>
</Dropdown>

<style lang="scss">
  .new-column-dropdown {
    padding: 0.8em;
    overflow: hidden;
    width: 16em;

    .submit {
      margin-top: 1em;
    }
  }
</style>
