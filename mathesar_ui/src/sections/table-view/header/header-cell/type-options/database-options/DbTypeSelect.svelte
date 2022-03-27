<script lang="ts">
  import { LabeledInput, Select } from '@mathesar-component-library';
  import type { DbType } from '@mathesar/App.d';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';

  export let selectedDbType: DbType | undefined;
  export let selectedAbstractType: AbstractType | undefined;

  $: dbTypeOptions = selectedAbstractType
    ? Array.from(selectedAbstractType.dbTypes)
    : [];
</script>

<LabeledInput label="Database type" layout="stacked">
  <Select
    triggerAppearance="default"
    triggerClass="db-type-select"
    bind:value={selectedDbType}
    options={dbTypeOptions}
  />
</LabeledInput>
