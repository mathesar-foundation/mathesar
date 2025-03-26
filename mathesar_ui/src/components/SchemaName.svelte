<script lang="ts">
  import { iconSchema } from '@mathesar/icons';
  import type { Schema } from '@mathesar/models/Schema';

  import NameWithIcon from './NameWithIcon.svelte';

  export let schema: Schema;
  export let iconHasBox = false;

  $: ({ name, isPublicSchema } = schema);
  $: isLocked = $isPublicSchema;
</script>

<span class="schema-name" class:is-locked={isLocked}>
  {$name}
</span>

<style>
  .schema-name {
    --NameWithIcon__icon-opacity: 1;
  }
  .schema-name.is-locked {
    --icon-color: var(
      var(--SchemaName__locked-schema-icon-color),
      var(--slate-500)
    );
  }
</style>
