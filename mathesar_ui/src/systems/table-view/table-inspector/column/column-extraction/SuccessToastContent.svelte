<script lang="ts">
  import { _ } from 'svelte-i18n';

  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconTableLink } from '@mathesar/icons';

  export let newFkColumnName: string;
</script>

<span> {$_('linked_via_foreign_key_column')}: </span>
<NameWithIcon
  icon={iconTableLink}
  name={newFkColumnName}
  truncate={false}
  bold
/>
