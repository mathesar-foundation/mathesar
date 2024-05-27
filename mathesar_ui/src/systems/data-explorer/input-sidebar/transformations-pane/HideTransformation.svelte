<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import { _ } from 'svelte-i18n';

  import ColumnName from '@mathesar/components/column/ColumnName.svelte';
  import { LabeledInput, MultiSelect } from '@mathesar-component-library';

  import type QueryHideTransformationModel from '../../QueryHideTransformationModel';
  import type { ProcessedQueryResultColumnMap } from '../../utils';

  const dispatch = createEventDispatcher();

  export let columns: ProcessedQueryResultColumnMap;
  export let model: QueryHideTransformationModel;
  export let limitEditing = false;

  function onValuesChange(values: string[]) {
    model.columnAliases = values;
    dispatch('update', model);
  }
</script>

<LabeledInput label={$_('select_columns_to_hide')} layout="stacked">
  <MultiSelect
    values={model.columnAliases}
    options={[...columns.values()].map((entry) => entry.column.alias)}
    on:change={(e) => onValuesChange(e.detail)}
    autoClearInvalidValues={false}
    disabled={limitEditing}
    let:option
  >
    {@const columnInfo = columns.get(option)?.column}
    <ColumnName
      column={{
        name: columnInfo?.display_name ?? '',
        type: columnInfo?.type ?? 'unknown',
        type_options: columnInfo?.type_options ?? null,
        display_options: null,
      }}
    />
  </MultiSelect>
</LabeledInput>
