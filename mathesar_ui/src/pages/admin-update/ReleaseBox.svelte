<script lang="ts">
  import { Button, Icon } from '@mathesar-component-library';
  import Logo from '@mathesar/components/Logo.svelte';
  import {
    iconCurrentlyInstalledVersion,
    iconExternalHyperlink,
    iconUpgradeAvailable,
  } from '@mathesar/icons';
  import { modal } from '@mathesar/stores/modal';
  import type { Release } from '@mathesar/stores/releases';
  import { assertExhaustive } from '@mathesar/utils/typeUtils';
  import UpgradeModal from './upgrade-modal/UpgradeModal.svelte';
  import { LL } from '@mathesar/i18n/i18n-svelte';

  const modalController = modal.spawnModalController();

  export let type:
    | 'available-upgrade'
    | 'currently-installed-and-latest'
    | 'current'
    | 'latest';
  export let release: Release;

  $: date = new Date(release.date);
  $: dateString = date.toLocaleDateString();
</script>

<div
  class="release"
  class:available-upgrade={type === 'available-upgrade'}
  class:currently-installed-and-latest={type ===
    'currently-installed-and-latest'}
>
  <div class="type">
    {#if type === 'available-upgrade'}
      <Icon {...iconUpgradeAvailable} />
      {$LL.releaseBox.newVersionAvailable()}
    {:else if type === 'currently-installed-and-latest'}
      <Icon {...iconCurrentlyInstalledVersion} />
      {$LL.releaseBox.runningLatestVersion()}
    {:else if type === 'current'}
      <Icon {...iconCurrentlyInstalledVersion} />
      {$LL.releaseBox.currentlyInstalled()}
    {:else if type === 'latest'}
      {$LL.releaseBox.latestAvailableVersion()}
    {:else}
      {assertExhaustive(type)}
    {/if}
  </div>
  <div class="details">
    <div class="left">
      <div class="logo"><Logo /></div>
      <div class="name">Mathesar</div>
      <div class="version">{release.tagName}</div>
    </div>
    <div class="right">
      <div class="date">{$LL.general.released()} {dateString}</div>
      <a href={release.notesUrl} class="notes" target="_blank">
        {$LL.general.releaseNotes()}
        <Icon {...iconExternalHyperlink} />
      </a>
    </div>
  </div>
  {#if type === 'available-upgrade'}
    <div class="update-action">
      <div class="message">{$LL.releaseBox.weCanInstallThisVersion()}</div>
      <Button appearance="secondary" on:click={() => modalController.open()}>
        {$LL.general.upgrade()}...
      </Button>
    </div>
  {/if}
</div>

{#if type === 'available-upgrade'}
  <UpgradeModal controller={modalController} {release} />
{/if}

<style>
  .release {
    border: solid 1px var(--slate-200);
    padding: 1rem;
    border-radius: var(--border-radius-m);
  }
  .release.available-upgrade {
    border-color: var(--yellow-200);
    background-color: var(--yellow-100);
  }
  .type {
    margin-bottom: 1rem;
  }
  .details {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
  }
  .left {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
  }
  .logo {
    background: var(--white);
    font-size: 2rem;
    color: white;
    padding: 0.4rem;
    display: flex;
    border: solid 1px var(--slate-200);
    border-radius: 500px;
    margin-right: 0.5rem;
  }
  .name,
  .version {
    font-size: var(--text-size-large);
    margin-right: 0.5rem;
  }
  .version {
    font-weight: bold;
  }
  .right {
    flex: 1 0 auto;
    color: var(--color-text-muted);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    margin: 0.5rem 0 0.5rem 0.5rem;
  }
  .right > :global(* + *) {
    margin-left: 1rem;
  }
  .notes {
    color: inherit;
  }
  .update-action {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-top: 1rem;
    padding-top: 1rem;
    border-top: 1px solid var(--yellow-200);
  }
  .message {
    color: var(--color-text-muted);
  }
</style>
