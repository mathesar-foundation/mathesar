<script lang="ts">
  import NameWithIcon from '@mathesar/components/NameWithIcon.svelte';
  import { iconTableLink } from '@mathesar/icons';

  export let newFkColumnName: string;
</script>

<div class="title">A link column has been added to this table</div>
<div class="message">
  The extracted columns are now linked via
  <NameWithIcon
    icon={iconTableLink}
    name={newFkColumnName}
    truncate={false}
    bold
  />
</div>
