<script lang="ts">
  import type { Constraint } from '@mathesar/stores/table-data';
  import { LL } from '@mathesar/i18n/i18n-svelte';

  export let constraint: Constraint;
</script>

<div class="constraint-details">
  <span>{$LL.general.constraintName()}:</span>
  <span>{constraint.name}</span>
</div>

<style lang="scss">
  .constraint-details {
    font-size: var(--text-size-small);
  }
</style>
