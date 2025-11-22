<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Identifier from '@mathesar/components/Identifier.svelte';
  import RichText from '@mathesar/components/rich-text/RichText.svelte';

  export let userName: string;
  export let databaseName: string;
</script>

<RichText
  text={$_('remove_collaborator_name_from_database_question')}
  let:slotName
>
  {#if slotName === 'userName'}
    <Identifier>{userName}</Identifier>
  {:else if slotName === 'databaseName'}
    <Identifier>{databaseName}</Identifier>
  {/if}
</RichText>
