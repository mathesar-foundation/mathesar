<script lang="ts">
  import { SpinnerButton } from '@mathesar-component-library';
  import Spinner from '@mathesar/component-library/spinner/Spinner.svelte';
  import ErrorBox from '@mathesar/components/message-boxes/ErrorBox.svelte';
  import { iconRefresh } from '@mathesar/icons';
  import type { ReleaseDataStore } from '@mathesar/stores/releases';
  import { toast } from '@mathesar/stores/toast';
  import { assertExhaustive } from '@mathesar/utils/typeUtils';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import RichText from '@mathesar/components/RichText.svelte';
  import ReleaseBox from './ReleaseBox.svelte';

  export let releaseDataStore: ReleaseDataStore;

  $: timestampedReleaseData = $releaseDataStore;
  $: ({ loading } = releaseDataStore);
  $: releaseData = $releaseDataStore?.value;
  $: upgradeStatus = releaseData?.upgradeStatus;
  $: lastChecked = (() => {
    if (!timestampedReleaseData) {
      return undefined;
    }
    return new Date(timestampedReleaseData.timestamp).toLocaleString();
  })();

  async function refresh() {
    try {
      await releaseDataStore.forceFetch();
    } catch (e) {
      toast.fromError(e);
    }
  }
</script>

{#if timestampedReleaseData}
  {@const { value } = timestampedReleaseData}
  {@const { current, latest } = value}
  <div class="releases">
    {#if $loading}
      <div>{$LL.softwareUpdateContent.loadingReleaseDate()}</div>
      <div><Spinner /></div>
    {:else if !current}
      <ErrorBox>
        <RichText
          text={$LL.softwareUpdateContent.errorInCurrentInstalled()}
          let:slotName
        >
          {#if slotName === 'hash'}
            <strong>{timestampedReleaseData.inputHash}</strong>
          {/if}
        </RichText>
      </ErrorBox>
      {#if latest}
        <ReleaseBox release={latest} type={'latest'} />
      {/if}
    {:else if upgradeStatus === 'up-to-date'}
      <ReleaseBox release={current} type="currently-installed-and-latest" />
    {:else if !latest}
      <ReleaseBox release={current} type="current" />
      <ErrorBox>{$LL.softwareUpdateContent.errorInLatestRelease()}</ErrorBox>
    {:else if upgradeStatus === 'upgradable'}
      <ReleaseBox release={latest} type={'available-upgrade'} />
      <ReleaseBox release={current} type={'current'} />
    {:else if upgradeStatus === undefined}
      <ReleaseBox release={current} type={'current'} />
      <ReleaseBox release={latest} type={'latest'} />
    {:else}
      {assertExhaustive(upgradeStatus)}
    {/if}
  </div>
{:else}
  <div>{$LL.softwareUpdateContent.loadingReleaseDate()}</div>
  <div><Spinner /></div>
{/if}

<div class="store-status">
  <div class="check-button">
    <SpinnerButton
      label="Check for Updates"
      appearance="default"
      icon={iconRefresh}
      onClick={refresh}
    />
  </div>
  {#if lastChecked}
    Last checked: {lastChecked}
  {/if}
</div>

<style>
  .releases > :global(*) {
    margin-bottom: 1rem;
  }
  .store-status {
    font-size: var(--text-size-small);
    color: var(--color-text-muted);
    text-align: right;
  }
  .check-button {
    margin-bottom: 0.25rem;
  }
</style>
