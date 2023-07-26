<script lang="ts">
  import {
    CancelOrProceedButtonPair,
    portalToWindowFooter,
  } from '@mathesar-component-library';
  import { iconNextStep } from '@mathesar/icons';
  import type { Release } from '@mathesar/stores/releases';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import RichText from '@mathesar/components/RichText.svelte';

  export let release: Release;
  export let onProceed: () => void;
  export let onClose: () => void;
</script>

<p>{$LL.upgradeConfirm.beforeUpgrading()}</p>
<ul>
  <li>
    <RichText text={$LL.upgradeConfirm.readReleaseNotes()} let:slotName>
      {#if slotName === 'releaseNotesLink'}
        <a href={release.notesUrl} target="_blank">
          {$LL.general.releaseNotes()}
        </a>
      {/if}
    </RichText>
  </li>
  <li>{$LL.upgradeConfirm.prepareForDowntime()}</li>
</ul>
<p>{$LL.upgradeConfirm.whileUpgrading()}</p>
<ul>
  <li>
    {$LL.upgradeConfirm.windowWillRemainOpen()}
  </li>
  <li>{$LL.upgradeConfirm.seeLoadingSpinner()}</li>
</ul>
<p>{$LL.upgradeConfirm.seeLoadingSpinner()}</p>
<ul>
  <li>
    {$LL.upgradeConfirm.afterUpgrading()}
  </li>
  <li>
    {$LL.upgradeConfirm.ifUpgradeSucceeds()}
  </li>
  <li>
    <RichText text={$LL.upgradeConfirm.ifUpgradeFails()} let:slotName>
      {#if slotName === 'documentationLink'}
        <a href="https://docs.mathesar.org/">{$LL.general.documentation()}</a>
      {/if}
    </RichText>
  </li>
</ul>
<div use:portalToWindowFooter>
  <CancelOrProceedButtonPair
    onCancel={onClose}
    proceedButton={{ label: $LL.general.continue(), icon: iconNextStep }}
    {onProceed}
  />
</div>
