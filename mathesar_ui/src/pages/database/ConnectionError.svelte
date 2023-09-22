<script lang="ts">
  import { States } from '@mathesar/api/utils/requestUtils';
  import { Button, Icon, iconLoading } from '@mathesar/component-library';
  import AnchorButton from '@mathesar/component-library/anchorButton/AnchorButton.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconEdit, iconRefresh } from '@mathesar/icons';
  import { getDatabaseConnectionEditUrl } from '@mathesar/routes/urls';
  import { refetchSchemasForDB, schemas } from '@mathesar/stores/schemas';

  export let databaseName: string;

  $: ({ state } = $schemas);

  async function handleRetry() {
    void refetchSchemasForDB(databaseName);
  }
</script>

<ErrorBox fullWidth>
  <p>Error connecting to the database</p>
  <div class="action-buttons">
    <AnchorButton
      href={getDatabaseConnectionEditUrl(databaseName)}
      appearance="secondary"
    >
      <Icon {...iconEdit} />
      <span>Edit Connection</span>
    </AnchorButton>
    <Button appearance="secondary" on:click={handleRetry}>
      {#if state === States.Loading}
        <Icon {...iconLoading} />
      {:else}
        <Icon {...iconRefresh} />
      {/if}
      <span>Retry</span>
    </Button>
  </div>
</ErrorBox>
