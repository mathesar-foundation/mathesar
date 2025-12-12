<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Option from './Option.svelte';
</script>

<Option>
  <span slot="type">{$_('uuid')}</span>
  <span slot="defaultValue">{$_('random_uuidv4')}</span>
</Option>
