<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Logo from '@mathesar/components/Logo.svelte';
  import {
    iconCurrentlyInstalledVersion,
    iconExternalHyperlink,
    iconUpgradeAvailable,
  } from '@mathesar/icons';
  import type { Release } from '@mathesar/stores/releases';
  import { Icon, assertExhaustive } from '@mathesar-component-library';

  export let type:
    | 'available-upgrade'
    | 'currently-installed-and-latest'
    | 'current'
    | 'latest';
  export let release: Release;

  $: date = new Date(release.date);
  $: dateString = date.toLocaleDateString();
  $: notesUrl = `https://docs.mathesar.org/releases/${release.tagName}/`;
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
      {$_('new_version_available')}
    {:else if type === 'currently-installed-and-latest'}
      <Icon {...iconCurrentlyInstalledVersion} />
      {$_('running_latest_version')}
    {:else if type === 'current'}
      <Icon {...iconCurrentlyInstalledVersion} />
      {$_('currently_installed')}
    {:else if type === 'latest'}
      {$_('latest_available_version_not_installed')}
    {:else}
      {assertExhaustive(type)}
    {/if}
  </div>
  <div class="details">
    <div class="left">
      <div class="logo"><Logo /></div>
      <div class="name">{$_('mathesar')}</div>
      <div class="version">{release.tagName}</div>
    </div>
    <div class="right">
      <div class="date">
        {$_('released_date', { values: { date: dateString } })}
      </div>
      <a href={notesUrl} class="notes btn btn-link" target="_blank">
        {#if type === 'available-upgrade'}
          {$_('release_notes_and_upgrade_instructions')}
        {:else}
          {$_('release_notes')}
        {/if}
        <Icon {...iconExternalHyperlink} />
      </a>
    </div>
  </div>
</div>

<style>
  .release {
    border: solid 1px var(--slate-200);
    padding: var(--size-large);
    border-radius: var(--border-radius-l);
    background-color: var(--card-background);
  }

  .release.available-upgrade {
    border-color: var(--warning-border-color);
    background-color: var(--warning-background-color);
    border-width: 1px;
  }

  .type {
    margin-bottom: 1rem;
    color: var(--text-color-primary);
    display: flex;
    align-items: center;
    gap: 0.5rem;
    font-weight: var(--font-weight-medium);
    font-size: var(--text-size-base);
  }

  .details {
    display: flex;
    align-items: center;
    flex-wrap: wrap;
    gap: 1rem;
  }

  .left {
    flex: 0 0 auto;
    display: flex;
    align-items: center;
    gap: 0.75rem;
  }

  .logo {
    background: var(--card-background);
    font-size: 1rem;
    color: var(--text-color-primary);
    padding: 0.5rem;
    display: flex;
    border: solid 1px var(--slate-200);
    border-radius: 500px;
  }

  .name {
    font-size: var(--text-size-large);
    color: var(--text-color-primary);
    font-weight: var(--font-weight-medium);
  }

  .version {
    font-size: var(--text-size-x-large);
    color: var(--text-color-primary);
    font-weight: var(--font-weight-extra-bold);
  }

  .right {
    flex: 1 0 auto;
    color: var(--text-color-muted);
    display: flex;
    align-items: center;
    justify-content: flex-end;
    gap: 1rem;
    margin-left: auto;
  }
</style>
