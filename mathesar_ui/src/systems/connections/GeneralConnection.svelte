<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { type GeneralConnection, getUsername } from './generalConnections';

  export let generalConnection: GeneralConnection;

  $: ({ connection } = generalConnection);
  $: user = getUsername(generalConnection);
  $: ({ host, port, database } = connection);
</script>

<span
  class="general-connection"
  class:internal={generalConnection.type === 'internal_database'}
>
  <span class="name">
    {#if generalConnection.type === 'user_database'}
      {generalConnection.connection.nickname}
    {:else}
      ({$_('internal_database')})
    {/if}
  </span>
  <span class="uri">
    {user}@<wbr />{host}:{port}/<wbr />{database}
  </span>
</span>

<style>
  .general-connection,
  .name,
  .uri {
    display: block;
  }
  .general-connection.internal .name {
    font-style: italic;
  }
  .uri {
    font-size: var(--text-size-small);
    color: var(--color-text-muted);
    margin-top: 0.5rem;
  }
</style>
