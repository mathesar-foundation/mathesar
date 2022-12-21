<script lang="ts">
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import { iconSchema } from '@mathesar/icons';
  import NameWithIcon from './NameWithIcon.svelte';

  export let schema: SchemaEntry;
  export let iconHasBox = false;

  $: isLocked = schema.name === 'public';
</script>

<span class="schema-name" class:is-locked={isLocked}>
  {schema.name}
  <!--
  <NameWithIcon icon={iconSchema} {iconHasBox}>
    {schema.name}
  </NameWithIcon>
  -->
</span>

<style>
  .schema-name {
    --icon-opacity: 1;
  }
  .schema-name.is-locked {
    --icon-color: var(--slate-800);
  }
</style>
