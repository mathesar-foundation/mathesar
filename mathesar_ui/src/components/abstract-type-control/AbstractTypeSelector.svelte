<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import {
    currentDbAbstractTypes,
    getAllowedAbstractTypesForDbTypeAndItsTargetTypes,
  } from '@mathesar/stores/abstract-types';
  import type { AbstractType } from '@mathesar/stores/abstract-types/types';
  import { LabeledInput, Select } from '@mathesar-component-library';

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

  $: allowedTypeConversions = getAllowedAbstractTypesForDbTypeAndItsTargetTypes(
    column.type,
    column.valid_target_types ?? [],
    $currentDbAbstractTypes.data,
  ).filter((item) => !['jsonlist', 'map'].includes(item.identifier));

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

<LabeledInput label={$_('data_type')} layout={'stacked'}>
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
