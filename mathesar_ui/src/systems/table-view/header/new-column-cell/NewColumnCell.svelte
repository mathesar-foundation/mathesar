<script lang="ts">
  import {
    Dropdown,
    Icon,
    TextInput,
    Spinner,
  } from '@mathesar-component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import {
    requiredField,
    makeForm,
    Field,
    FormSubmit,
  } from '@mathesar/components/form';
  import { columnNameIsAvailable } from '@mathesar/utils/columnUtils';
  import { iconAddNew } from '@mathesar/icons';
  import { toast } from '@mathesar/stores/toast';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import ColumnTypeSelector from './ColumnTypeSelector.svelte';

  const tabularData = getTabularDataStoreFromContext();
  $: ({ columnsDataStore } = $tabularData);
  $: ({ columns } = columnsDataStore);

  $: columnName = requiredField('', [columnNameIsAvailable($columns)]);
  const columnType = requiredField<string | undefined>(undefined);
  $: form = makeForm({ columnName, columnType });

  let requestStatus: RequestStatus;
  $: isLoading = requestStatus?.state === 'processing';

  function clearValues() {
    $columnName = '';
    $columnType = undefined;
  }

  async function addColumn(closeDropdown: () => void) {
    const newColumn = {
      name: $columnName,
      type: $columnType,
      nullable: true,
      primary_key: false,
    };
    try {
      requestStatus = { state: 'processing' };
      await columnsDataStore.add(newColumn);
      closeDropdown();
      requestStatus = { state: 'success' };
    } catch (err) {
      const errorMessage = getErrorMessage(err);
      toast.error(`Unable to add column. ${errorMessage}`);
      requestStatus = { state: 'failure', errors: [errorMessage] };
    }
  }
</script>

<Dropdown
  closeOnInnerClick={false}
  triggerAppearance="secondary"
  showArrow={false}
  ariaLabel="New Column"
  on:close={clearValues}
  disabled={isLoading}
>
  <svelte:fragment slot="trigger">
    {#if isLoading}
      <Spinner />
    {:else}
      <Icon class="opt" {...iconAddNew} size="0.9em" />
    {/if}
  </svelte:fragment>
  <div slot="content" class="new-column-dropdown" let:close>
    <Field
      field={columnName}
      input={{ component: TextInput, props: { disabled: isLoading } }}
      label="Column Name"
      layout="stacked"
    />
    <Field
      field={columnType}
      input={{ component: ColumnTypeSelector, props: { disabled: isLoading } }}
      label="Select Type"
      layout="stacked"
    />
    <div class="submit">
      <FormSubmit
        {form}
        proceedButton={{ label: 'Add' }}
        onProceed={() => addColumn(close)}
        onCancel={close}
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
