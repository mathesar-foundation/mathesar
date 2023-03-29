<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { Select, LabeledInput } from '@mathesar-component-library';
  import {
    currentDbAbstractTypes,
    getAllowedAbstractTypesForDbTypeAndItsTargetTypes,
  } from '@mathesar/stores/abstract-types';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import type { ColumnWithAbstractType } from './utils';

  const dispatch = createEventDispatcher<{
    reset: undefined;
    change: {
      type: ColumnWithAbstractType['type'];
      abstractType: ColumnWithAbstractType['abstractType'];
    };
  }>();

  export let column: ColumnWithAbstractType;
  export let selectedAbstractType: AbstractType;
  export let disabled = false;

  // jsonlist and map are not allowed as target untill there UI is ready
  $: allowedTypeConversions = getAllowedAbstractTypesForDbTypeAndItsTargetTypes(
    column.type,
    column.valid_target_types ?? [],
    $currentDbAbstractTypes.data,
  ).filter((item) => item.identifier !== 'jsonlist' && item.identifier !== 'map');

  function selectAbstractType(
    newAbstractType: ColumnWithAbstractType['abstractType'] | undefined,
  ) {
    if (!newAbstractType) {
      console.error('This should never occur. AbstractType is undefined');
      return;
    }
    if (selectedAbstractType !== newAbstractType) {
      if (newAbstractType.identifier === column.abstractType.identifier) {
        dispatch('reset');
      } else if (newAbstractType.defaultDbType) {
        dispatch('change', {
          type: newAbstractType.defaultDbType,
          abstractType: newAbstractType,
        });
      } else if (newAbstractType.dbTypes.size > 0) {
        const [selectedDbType] = newAbstractType.dbTypes;
        dispatch('change', {
          type: selectedDbType,
          abstractType: newAbstractType,
        });
      }
      selectedAbstractType = newAbstractType;
    }
  }
</script>

<LabeledInput label="Data Type" layout={'stacked'}>
  <Select
    options={allowedTypeConversions}
    value={selectedAbstractType}
    getLabel={(entry) => entry?.name ?? ''}
    autoSelect="none"
    on:change={(e) => selectAbstractType(e.detail)}
    let:option
    let:label
    {disabled}
  >
    <NameWithIcon icon={option.getIcon()}>
      {label}
    </NameWithIcon>
  </Select>
</LabeledInput>
