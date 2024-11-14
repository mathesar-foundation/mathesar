<script lang="ts">
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import {
    defaultDbType,
    getAbstractTypeForDbType,
    getAllowedAbstractTypesForNewColumn,
    getDefaultDbTypeOfAbstractType,
  } from '@mathesar/stores/abstract-types';
  import { SelectionList } from '@mathesar-component-library';

  export let value = defaultDbType;
  export let disabled = false;

  $: abstractType = getAbstractTypeForDbType(value);
  $: options = getAllowedAbstractTypesForNewColumn();
</script>

<SelectionList
  {options}
  getLabel={(entry) => entry?.name ?? ''}
  value={abstractType}
  on:change={(e) => {
    value = e.detail ? getDefaultDbTypeOfAbstractType(e.detail) : defaultDbType;
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
