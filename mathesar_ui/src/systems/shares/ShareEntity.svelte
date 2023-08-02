<script lang="ts">
  import { getContext, tick } from 'svelte';
  import {
    SpinnerButton,
    Spinner,
    TextInput,
    InputGroup,
    Button,
    Icon,
    type AccompanyingElements,
  } from '@mathesar-component-library';
  import type { RequestStatus } from '@mathesar/api/utils/requestUtils';
  import type { ShareApi, Share } from '@mathesar/api/shares';
  import { getApiErrorMessages } from '@mathesar/api/utils/errors';
  import {
    iconCopyMajor,
    iconAddNew,
    iconRecreate,
    iconDisable,
    iconOpenLinkInNewTab,
  } from '@mathesar/icons';
  import Errors from '@mathesar/components/Errors.svelte';
  import { toast } from '@mathesar/stores/toast';
  import {
    confirm,
    confirmationController,
  } from '@mathesar/stores/confirmation';

  const dropdownAccompanyingElements = getContext<
    AccompanyingElements | undefined
  >('dropdownAccompanyingElements');

  export let entityId: number;
  export let api: ShareApi;
  export let text: {
    header: string;
    description: string;
    empty: string;
  };
  export let getLink: (s: Share) => string;

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

  function setConfirmModalToAccompanyDropdown(): () => void {
    if (!dropdownAccompanyingElements) {
      return () => {};
    }
    const modal = document.querySelector<HTMLElement>(
      `[data-modal-id='${confirmationController.modal.modalId}']`,
    );
    if (!modal) {
      return () => {};
    }
    return dropdownAccompanyingElements.add(modal);
  }

  async function regenerateLink() {
    const confirmationPromise = confirm({
      title: 'Remove old link and create a new link?',
      body: [
        'Once you regenerate a new link, the old link will no longer work',
        'Are you sure you want to proceed?',
      ],
      proceedButton: {
        label: 'Regenerate link',
        icon: undefined,
      },
    });
    await tick();
    const cleanupDropdown = setConfirmModalToAccompanyDropdown();
    const isConfirmed = await confirmationPromise;
    cleanupDropdown();
    if (isConfirmed) {
      toast.error('Not implemented yet');
    }
  }

  async function disableLink() {
    if (!share) {
      throw new Error(
        `Unable to disable share.
        This state should never occur`,
      );
    }
    const confirmationPromise = confirm({
      title: 'Disable link?',
      body: 'Are you sure you want to proceed?',
      proceedButton: {
        label: 'Disable link',
        icon: undefined,
      },
    });
    await tick();
    const cleanupDropdown = setConfirmModalToAccompanyDropdown();
    const isConfirmed = await confirmationPromise;
    cleanupDropdown();
    if (isConfirmed) {
      share = await api.update(entityId, share.id, { enabled: false });
    }
  }

  $: shareLink = share
    ? `${window.location.origin}${getLink(share)}`
    : undefined;
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
          <TextInput disabled value={shareLink} />
          <Button appearance="secondary">
            <Icon {...iconCopyMajor} />
          </Button>
          <a class="btn btn-secondary" target="_blank" href={shareLink}>
            <Icon {...iconOpenLinkInNewTab} />
          </a>
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
