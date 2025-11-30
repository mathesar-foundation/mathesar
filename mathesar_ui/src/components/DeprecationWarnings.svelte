<script lang="ts">
  import { onMount } from 'svelte';

  import {
    deprecationWarnings,
    postgresDeprecationWarnings,
  } from '../stores/deprecationWarnings';

  import DeprecationWarningBox from './message-boxes/DeprecationWarningBox.svelte';

  onMount(async () => {
    await deprecationWarnings.refresh();
  });
</script>

<div class="deprecation-warnings-container">
  {#each $postgresDeprecationWarnings as warning (warning.database_id + warning.warning_type)}
    <DeprecationWarningBox
      databaseName={warning.database_nickname || warning.database_name}
      postgresVersion={warning.postgres_major_version}
      warningMessage={warning.warning_message}
    />
  {/each}
</div>

<style>
  .deprecation-warnings-container {
    display: flex;
    flex-direction: column;
    gap: 1rem;
  }
</style>
