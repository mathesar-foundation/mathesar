<script lang="ts">
  import { CheckboxGroup } from '@mathesar-component-library';

  import type { SimpleManyToManyRelationship } from './joinConfigUtils';

  export let simpleManyToManyRelationships: SimpleManyToManyRelationship[];
</script>

<CheckboxGroup
  options={simpleManyToManyRelationships}
  getCheckboxLabel={(r) => r.targetTable.name}
/>
