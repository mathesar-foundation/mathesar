<script lang="ts">
  import type { SchemaEntry } from '@mathesar/AppTypes';
  import { iconSchema } from '@mathesar/icons';
  import NameWithIcon from './NameWithIcon.svelte';

  export let schema: SchemaEntry;
</script>

<NameWithIcon icon={iconSchema}>{schema.name}</NameWithIcon>
