<script lang="ts">
  import {
    SpinnerButton,
    Spinner,
    TextInput,
    InputGroup,
    Button,
    Icon,
  } from '@mathesar-component-library';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import type { ShareApi, Share } from '@mathesar/api/shares';
  import { getApiErrorMessages } from '@mathesar/api/utils/errors';
  import {
    iconCopyMajor,
    iconAddNew,
    iconRecreate,
    iconDisable,
  } from '@mathesar/icons';
  import Errors from '@mathesar/components/Errors.svelte';
  import { toast } from '@mathesar/stores/toast';

  export let entityId: number;
  export let api: ShareApi;
  export let text: {
    header: string;
    description: string;
    empty: string;
  };

  let loadRequestStatus: RequestStatus = { state: 'processing' };
  let share: Share | undefined = undefined;

  async function fetchShares() {
    if (!api || !entityId) {
      throw new Error(
        `Unable to request shares because api or entityId is missing.
        This state should never occur`,
      );
    }
    try {
      loadRequestStatus = { state: 'processing' };
      const shares = await api.list(entityId);
      [share] = shares.results;
      loadRequestStatus = { state: 'success' };
    } catch (e) {
      loadRequestStatus = { state: 'failure', errors: getApiErrorMessages(e) };
    }
  }

  $: api, entityId, void fetchShares();

  async function generateOrEnableShare() {
    if (share && !share.enabled) {
      share = await api.update(entityId, share.id, { enabled: true });
    } else {
      share = await api.add(entityId);
    }
  }

  async function regenerateLink() {
    toast.error('Not implemented yet');
  }

  async function disableLink() {
    if (!share) {
      throw new Error(
        `Unable to disable share.
        This state should never occur`,
      );
    }
    share = await api.update(entityId, share.id, { enabled: false });
  }
</script>

<div class="share-entity-container">
  <header>
    {text.header}
  </header>
  <div class="description">
    {text.description}
  </div>

  <div class="content">
    {#if loadRequestStatus.state === 'processing'}
      <Spinner />
    {:else if loadRequestStatus.state === 'success'}
      {#if share && share.enabled}
        <InputGroup>
          <TextInput disabled value={share.slug} />
          <Button appearance="secondary">
            <Icon {...iconCopyMajor} />
          </Button>
        </InputGroup>
        <div class="share-control-options">
          <SpinnerButton
            appearance="secondary"
            onClick={regenerateLink}
            icon={iconRecreate}
            label="Regenerate link"
          />
          <SpinnerButton
            appearance="secondary"
            onClick={disableLink}
            icon={iconDisable}
            label="Disable link"
          />
        </div>
      {:else}
        <div>
          {text.empty}
        </div>
        <div>
          <SpinnerButton
            onClick={generateOrEnableShare}
            icon={iconAddNew}
            label="Create link"
          />
        </div>
      {/if}
    {:else}
      <Errors errors={loadRequestStatus.errors} />
    {/if}
  </div>
</div>

<style lang="scss">
  .share-entity-container {
    padding: 1rem;
    min-width: 20rem;
    max-width: 25rem;

    header {
      font-weight: 700;
    }
    .description {
      color: var(--slate-400);
      font-size: var(--size-small);
      margin-top: 0.2rem;
    }
    .content {
      margin-top: 0.8rem;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;

      .share-control-options {
        display: flex;
        justify-content: space-between;
      }
    }
  }
</style>
