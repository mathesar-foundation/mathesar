<script lang="ts">
  import { Select, defined } from '@mathesar/component-library';

  import { type NewPkColumnType, pkColumnTypeMap } from './utils';

  export let value: NewPkColumnType;

  const options = Object.keys(pkColumnTypeMap) as NewPkColumnType[];
</script>

<Select
  bind:value
  {options}
  getLabel={(option) => defined(option, (o) => pkColumnTypeMap[o].label) ?? ''}
/>
