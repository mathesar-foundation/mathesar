<script lang="ts">
  import {
    CancelOrProceedButtonPair,
    portalToWindowFooter,
  } from '@mathesar-component-library';
  import { iconNextStep } from '@mathesar/icons';
  import type { Release } from '@mathesar/stores/releases';

  export let release: Release;
  export let onProceed: () => void;
  export let onClose: () => void;
</script>

<p>Before Upgrading</p>
<ul>
  <li>
    Read the
    <a href={release.notesUrl} target="_blank">release notes</a>
    to see if this release requires any special upgrade instructions.
  </li>
  <li>Prepare your users for up to five minutes of downtime.</li>
</ul>
<p>While Upgrading</p>
<ul>
  <li>
    This window will remain open but all features within Mathesar will be
    unusable.
  </li>
  <li>You will see a loading spinner but no progress bar.</li>
</ul>
<p>After Upgrading</p>
<ul>
  <li>
    This page will automatically reload, showing the software update status
    again.
  </li>
  <li>
    If the upgrade succeeds, you will see that you're running the latest
    version.
  </li>
  <li>
    If the upgrade fails, the update status screen will still show that an
    upgrade is available, and you will need to refer to our
    <a href="https://docs.mathesar.org/">documentation</a>
    for further troubleshooting.
  </li>
</ul>
<div use:portalToWindowFooter>
  <CancelOrProceedButtonPair
    onCancel={onClose}
    proceedButton={{ label: 'Continue', icon: iconNextStep }}
    {onProceed}
  />
</div>
