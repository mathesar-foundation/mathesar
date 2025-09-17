<script lang="ts">
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import {
    defaultAbstractType,
    getAllowedAbstractTypesForNewColumn,
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
  {disabled}
  let:option
  let:label
>
  <NameWithIcon icon={option.getIcon()}>
    {label}
  </NameWithIcon>
</SelectionList>
