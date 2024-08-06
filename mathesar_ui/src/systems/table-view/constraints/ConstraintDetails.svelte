<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { Constraint } from '@mathesar/api/rpc/constraints';

  export let constraint: Constraint;
</script>

<div class="constraint-details">
  <span>{$_('constraint_name')}:</span>
  <span>{constraint.name}</span>
</div>

<style lang="scss">
  .constraint-details {
    font-size: var(--text-size-small);
  }
</style>
