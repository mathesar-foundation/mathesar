<script lang="ts">
  import Identifier from '@mathesar/components/Identifier.svelte';
  import Null from '@mathesar/components/Null.svelte';

  export let columnName: string;
</script>

<Identifier>{columnName}</Identifier> does not allow <Null />
