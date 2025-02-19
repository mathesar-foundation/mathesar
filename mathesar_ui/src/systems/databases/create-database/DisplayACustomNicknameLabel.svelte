<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { Help } from '@mathesar/component-library';
</script>

<span>
  {$_('use_a_custom_nickname_instead')}
  <Help>{$_('custom_database_nickname_label_help')}</Help>
</span>
