<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Identifier from '@mathesar/components/Identifier.svelte';
  import { RichText } from '@mathesar/components/rich-text';

  export let userName: string;
  export let databaseName: string;
  export let roleName: string;
</script>

<ul>
  <li>
    <RichText text={$_('remove_collaborator_body_1')} let:slotName>
      {#if slotName === 'userName'}
        <Identifier>{userName}</Identifier>
      {:else if slotName === 'databaseName'}
        <Identifier>{databaseName}</Identifier>
      {/if}
    </RichText>
  </li>
  <li>
    <RichText text={$_('remove_collaborator_body_2')} let:slotName>
      {#if slotName === 'userName'}
        <Identifier>{userName}</Identifier>
      {/if}
    </RichText>
  </li>
  <li>
    <RichText text={$_('remove_collaborator_body_3')} let:slotName>
      {#if slotName === 'roleName'}
        <Identifier>{roleName}</Identifier>
      {/if}
    </RichText>
  </li>
</ul>
