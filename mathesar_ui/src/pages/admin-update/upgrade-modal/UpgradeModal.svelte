<script lang="ts">
  import { router } from 'tinro';

  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';
  import { upgradeApi } from '@mathesar/api/upgrade';
  import { ADMIN_UPDATE_PAGE_URL } from '@mathesar/routes/urls';
  import type { Release } from '@mathesar/stores/releases';
  import { getErrorMessage } from '@mathesar/utils/errors';
  import { assertExhaustive } from '@mathesar/utils/typeUtils';
  import UpgradeConfirm from './UpgradeConfirm.svelte';
  import UpgradeError from './UpgradeError.svelte';
  import UpgradeProcessing from './UpgradeProcessing.svelte';

  export let controller: ModalController;
  export let release: Release;

  type State =
    | { status: 'confirm' }
    | { status: 'processing' }
    | { status: 'error'; errorMsg: string };
  type Status = State['status'];

  function getInitialState(): State {
    return { status: 'confirm' };
  }

  let state: State = getInitialState();

  $: version = `Mathesar ${release.tagName}`;
  $: titleMap = ((): Record<Status, string> => ({
    confirm: `Upgrade to ${version}`,
    processing: `Upgrading to ${version}`,
    error: 'Error Upgrading',
  }))();
  $: title = titleMap[state.status];

  function init() {
    state = getInitialState();
  }

  async function performUpgrade() {
    state = { status: 'processing' };
    try {
      await upgradeApi.upgrade();
      router.goto(ADMIN_UPDATE_PAGE_URL);
    } catch (e) {
      state = { status: 'error', errorMsg: getErrorMessage(e) };
    }
  }
</script>

<ControlledModal {controller} {title} on:open={init} size="large">
  {#if state.status === 'confirm'}
    <UpgradeConfirm
      {release}
      onProceed={performUpgrade}
      onClose={() => controller.close()}
    />
  {:else if state.status === 'processing'}
    <UpgradeProcessing />
  {:else if state.status === 'error'}
    <UpgradeError
      message={state.errorMsg}
      onClose={() => controller.close()}
      onRetry={performUpgrade}
    />
  {:else}
    {assertExhaustive(state)}
  {/if}
</ControlledModal>
