<script lang="ts">
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconTableLink } from '@mathesar/icons';

  export let tablename: string;
  export let newFkColumnName: string;
</script>

<span>
  A new table '{tablename}' has been created with the extracted columns. It is
  now linked via
</span>
<NameWithIcon
  icon={iconTableLink}
  name={newFkColumnName}
  truncate={false}
  bold
/>
