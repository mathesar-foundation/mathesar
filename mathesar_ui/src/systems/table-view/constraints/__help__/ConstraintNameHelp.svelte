<script lang="ts">
  import { Help } from '@mathesar-component-library';
  import { LL } from '@mathesar/i18n/i18n-svelte';
</script>

<Help>
  <p>
    {$LL.constraintNameHelp.constraintNameDb()}
  </p>
  <p>
    {$LL.constraintNameHelp.constraintNameMathesar()}
  </p>
</Help>
