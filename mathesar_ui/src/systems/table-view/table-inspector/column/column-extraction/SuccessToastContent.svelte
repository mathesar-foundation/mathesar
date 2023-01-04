<script lang="ts">
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconTableLink } from '@mathesar/icons';

  export let newFkColumnName: string;
</script>

<span> It is linked via a foreign key column: </span>
<NameWithIcon
  icon={iconTableLink}
  name={newFkColumnName}
  truncate={false}
  bold
/>
