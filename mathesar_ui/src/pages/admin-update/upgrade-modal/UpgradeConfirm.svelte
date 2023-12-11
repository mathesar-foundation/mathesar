<script lang="ts">
  import { _ } from 'svelte-i18n';
  import {
    CancelOrProceedButtonPair,
    portalToWindowFooter,
  } from '@mathesar-component-library';
  import { iconNextStep } from '@mathesar/icons';
  import type { Release } from '@mathesar/stores/releases';
  import { RichText } from '@mathesar/components/rich-text';

  export let release: Release;
  export let onProceed: () => void;
  export let onClose: () => void;
</script>

<p>{$_('before_upgrading')}</p>
<ul>
  <li>
    <RichText text={$_('read_release_notes')} let:slotName let:translatedArg>
      {#if slotName === 'releaseNotesLink'}
        <a href={release.notesUrl} target="_blank">{translatedArg}</a>
      {/if}
    </RichText>
  </li>
  <li>{$_('prepare_downtime')}</li>
</ul>
<p>{$_('while_upgrading')}</p>
<ul>
  <li>
    {$_('window_remains_open_mathesar_unusable')}
  </li>
  <li>{$_('loading_spinner_no_progress_bar')}</li>
</ul>
<p>{$_('after_upgrading')}</p>
<ul>
  <li>
    {$_('page_automatic_reload_update')}
  </li>
  <li>
    {$_('if_upgrade_succeeds_help')}
  </li>
  <li>
    <RichText text={$_('if_upgrade_fails_help')} let:slotName let:translatedArg>
      {#if slotName === 'documentationLink'}
        <a href="https://docs.mathesar.org/" target="_blank">{translatedArg}</a>
      {/if}
    </RichText>
  </li>
</ul>
<div use:portalToWindowFooter>
  <CancelOrProceedButtonPair
    onCancel={onClose}
    proceedButton={{ label: $_('continue'), icon: iconNextStep }}
    {onProceed}
  />
</div>
