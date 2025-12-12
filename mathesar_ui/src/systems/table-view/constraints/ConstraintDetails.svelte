<script lang="ts">
  import { _ } from 'svelte-i18n';

  import type { RawConstraint } from '@mathesar/api/rpc/constraints';

  export let constraint: RawConstraint;
</script>

<div class="constraint-details">
  <span>{$_('constraint_name')}:</span>
  <span>{constraint.name}</span>
</div>

<style lang="scss">
  .constraint-details {
    font-size: var(--sm1);
  }
</style>
