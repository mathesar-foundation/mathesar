<script lang="ts">
  import { SelectionList } from '@mathesar-component-library';
  import {
    currentDbAbstractTypes,
    getAllowedAbstractTypesForNewColumn,
    getAbstractTypeForDbType,
    defaultDbType,
  } from '@mathesar/stores/abstract-types';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';

  export let value = defaultDbType;
  export let disabled = false;

  $: abstractType = getAbstractTypeForDbType(
    value,
    $currentDbAbstractTypes.data,
  );

  $: options = getAllowedAbstractTypesForNewColumn(
    $currentDbAbstractTypes.data,
  );
</script>

<SelectionList
  {options}
  getLabel={(entry) => entry?.name ?? ''}
  value={abstractType}
  on:change={(e) => {
    value = e.detail?.defaultDbType ?? defaultDbType;
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
