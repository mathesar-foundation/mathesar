<script lang="ts">
  import { Select } from '@mathesar/component-library';
  import type { LinkedTable } from './columnExtractionTypes';
  import LinkedTableName from './LinkedTableName.svelte';

  export let linkedTables: LinkedTable[];
  export let value: LinkedTable | undefined = undefined;

  function getLabel(v: LinkedTable | undefined) {
    if (v === undefined) {
      return '';
    }
    return {
      component: LinkedTableName,
      props: { linkedTable: v },
    };
  }
</script>

<Select options={linkedTables} bind:value {getLabel} />
