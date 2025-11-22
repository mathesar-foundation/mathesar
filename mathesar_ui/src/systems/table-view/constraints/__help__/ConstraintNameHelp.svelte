<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { Help } from '@mathesar-component-library';
</script>

<Help>
  <p>
    {$_('constraint_name_unique_help')}
  </p>
  <p>
    {$_('constraint_name_unique_mathesar_relevance_help')}
  </p>
</Help>
