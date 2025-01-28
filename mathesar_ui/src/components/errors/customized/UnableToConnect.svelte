<script lang="ts">
  import { _ } from 'svelte-i18n';

  export let message: string;
</script>

<p>{$_('unable_to_connect_to_database')}</p>
<p>{message}</p>
