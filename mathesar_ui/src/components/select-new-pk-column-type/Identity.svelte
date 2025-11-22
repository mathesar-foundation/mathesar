<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Option from './Option.svelte';
</script>

<Option>
  <span slot="type">{$_('integer')}</span>
  <span slot="defaultValue">{$_('auto_incrementing_identity')}</span>
</Option>
