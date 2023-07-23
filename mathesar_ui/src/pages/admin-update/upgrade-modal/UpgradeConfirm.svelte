<script lang="ts">
  import {
    CancelOrProceedButtonPair,
    portalToWindowFooter,
  } from '@mathesar-component-library';
  import { iconNextStep } from '@mathesar/icons';
  import type { Release } from '@mathesar/stores/releases';
  import { LL } from '@mathesar/i18n/i18n-svelte';
  import RichText from '@mathesar/components/RichText.svelte';
  import { text } from 'svelte/internal';
  import { generateSelectOptions } from '@mathesar/component-library/data-type-based-input/utils';

  export let release: Release;
  export let onProceed: () => void;
  export let onClose: () => void;
</script>

<p>{$LL.upgradeConfirmation.beforeUpgrading()}</p>
<ul>
  <li>
    <RichText text={$LL.upgradeConfirmation.readReleaseNotes()} let:slotName>
      {#if slotName === 'releaseNotesLink'}
        <a href={release.notesUrl} target="_blank">
          {$LL.general.releaseNotes()}
        </a>
      {/if}
    </RichText>
  </li>
  <li>{$LL.upgradeConfirmation.prepareForDowntime()}</li>
</ul>
<p>{$LL.upgradeConfirmation.whileUpgrading()}</p>
<ul>
  <li>
    {$LL.upgradeConfirmation.windowWillRemainOpen()}
  </li>
  <li>{$LL.upgradeConfirmation.seeLoadingSpinner()}</li>
</ul>
<p>{$LL.upgradeConfirmation.seeLoadingSpinner()}</p>
<ul>
  <li>
    {$LL.upgradeConfirmation.afterUpgrading()}
  </li>
  <li>
    {$LL.upgradeConfirmation.ifUpgradeSucceeds()}
  </li>
  <li>
    <RichText text={$LL.upgradeConfirmation.ifUpgradeFails()} let:slotName>
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
