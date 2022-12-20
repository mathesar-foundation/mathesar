<script lang="ts">
  import type { Constraint } from '@mathesar/stores/table-data';

  export let constraint: Constraint;
</script>

<div class="constraint-details">
  <span>Constraint Name:</span>
  <span>{constraint.name}</span>
</div>

<style lang="scss">
  .constraint-details {
    font-size: var(--text-size-small);
  }
</style>
