<script lang="ts">
  import { iconSchema } from '@mathesar/icons';
  import type { Schema } from '@mathesar/models/Schema';

  import NameWithIcon from './NameWithIcon.svelte';

  export let schema: Schema;

  $: ({ name } = schema);
</script>

<NameWithIcon
  icon={iconSchema}
  cssVariables={{ '--icon-color': 'var(--color-schema)' }}
>
  <slot schemaName={$name}>
    {$name}
  </slot>
</NameWithIcon>
