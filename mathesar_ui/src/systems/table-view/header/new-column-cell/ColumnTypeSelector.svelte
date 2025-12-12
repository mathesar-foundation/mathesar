<script lang="ts">
  import { AbstractTypeName } from '@mathesar/components/abstract-type-control';
  import {
    defaultAbstractType,
    getAllowedAbstractTypesForNewColumn,
    isAbstractTypeDisabled,
  } from '@mathesar/stores/abstract-types';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import { SelectionList } from '@mathesar-component-library';

  export let value: AbstractType;
  export let disabled = false;

  $: options = getAllowedAbstractTypesForNewColumn();
</script>

<SelectionList
  {options}
  getLabel={(entry) => entry?.name ?? ''}
  {value}
  on:change={(e) => {
    value = e.detail ?? defaultAbstractType;
  }}
  valuesAreEqual={(a, b) => a?.identifier === b?.identifier}
  offsetOnFocus={2}
  isOptionDisabled={(option) => isAbstractTypeDisabled(option)}
  {disabled}
  let:option
>
  <AbstractTypeName abstractType={option} />
</SelectionList>
