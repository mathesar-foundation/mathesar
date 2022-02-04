<script lang="ts">
  import { LabeledInput, Select } from '@mathesar-component-library';
  import type { DbType } from '@mathesar/App.d';
  import type { SelectOption } from '@mathesar-component-library/types';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';

  export let selectedDbType: DbType | undefined;
  export let selectedAbstractType: AbstractType | undefined;

  function calculateDBTypeOptions(
    _selectedAbstractType: AbstractType | undefined,
  ): SelectOption[] {
    if (_selectedAbstractType) {
      return Array.from(_selectedAbstractType?.dbTypes).map((entry) => ({
        id: entry,
        label: entry,
      }));
    }
    return [];
  }

  $: dbTypeOptions = calculateDBTypeOptions(selectedAbstractType);

  function onDbTypeChange(e: CustomEvent<{ option: SelectOption<DbType> }>) {
    const { id } = e.detail.option;
    selectedDbType = id;
  }
</script>

<LabeledInput label="Database type" layout="stacked">
  <Select
    triggerAppearance="default"
    triggerClass="db-type-select"
    value={{
      id: selectedDbType,
      label: selectedDbType,
    }}
    options={dbTypeOptions}
    on:change={onDbTypeChange}
  />
</LabeledInput>
