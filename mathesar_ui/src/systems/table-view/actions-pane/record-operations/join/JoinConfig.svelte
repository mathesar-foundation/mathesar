<script lang="ts">
  import { CheckboxGroup, component } from '@mathesar-component-library';

  import type { SimpleManyToManyRelationship } from './joinConfigUtils';
  import TableName from '@mathesar/components/TableName.svelte';

  export let simpleManyToManyRelationships: SimpleManyToManyRelationship[];
</script>

<CheckboxGroup
  options={simpleManyToManyRelationships}
  getCheckboxLabel={(r) =>
    component(TableName, { table: { name: r.targetTable.name } })}
/>
