<script lang="ts">
  import { iconSchema } from '@mathesar/icons';
  import type { Schema } from '@mathesar/models/Schema';

  import NameWithIcon from './NameWithIcon.svelte';

  export let schema: Schema;

  $: ({ name, isPublicSchema } = schema);
</script>

<NameWithIcon icon={iconSchema} name={$name} />
