<script lang="ts">
  import { Help } from '@mathesar-component-library';
  import { LL } from '@mathesar/i18n/i18n-svelte';
</script>

<Help>
  <p>
    {$LL.constraintsConstraintNameHelp.constraintNameDb()}
  </p>
  <p>
    {$LL.constraintsConstraintNameHelp.constraintNameMathesar()}
  </p>
</Help>
