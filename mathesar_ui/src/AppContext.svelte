<script lang="ts">
  import { get } from 'svelte/store';

  import { setBreadcrumbItemsInContext } from '@mathesar/components/breadcrumb/breadcrumbUtils';
  import { setNewClipboardHandlerStoreInContext } from '@mathesar/stores/clipboard';
  import { confirmationController } from '@mathesar/stores/confirmation';
  import { modal } from '@mathesar/stores/modal';
  import { setReleasesStoreInContext } from '@mathesar/stores/releases';
  import { toast } from '@mathesar/stores/toast';
  import { setUserProfileStoreInContext } from '@mathesar/stores/userProfile';
  import { AnonymousViewerUserModel } from '@mathesar/stores/users';
  import ModalRecordSelector from '@mathesar/systems/record-selector/ModalRecordSelector.svelte';
  import {
    RecordSelectorController,
    setRecordSelectorControllerInContext,
  } from '@mathesar/systems/record-selector/RecordSelectorController';
  import type { CommonData } from '@mathesar/utils/preloadData';
  import { Confirmation, ToastPresenter } from '@mathesar-component-library';

  export let commonData: CommonData;

  setBreadcrumbItemsInContext([]);

  function setUserProfileAndReleaseStores() {
    const user =
      commonData.routing_context === 'anonymous'
        ? new AnonymousViewerUserModel()
        : commonData.user;

    const userProfileStore = setUserProfileStoreInContext(user);
    const userProfile = get(userProfileStore);
    if (commonData.is_authenticated && userProfile.isMathesarAdmin) {
      // Toggle these lines to test with a mock tag name
      // setReleasesStoreInContext('1.75.0');
      setReleasesStoreInContext(commonData.current_release_tag_name);
    }
  }

  $: commonData, setUserProfileAndReleaseStores();

  const recordSelectorModal = modal.spawnModalController();
  const recordSelectorController = new RecordSelectorController({
    onOpen: () => recordSelectorModal.open(),
    onClose: () => recordSelectorModal.close(),
    nestingLevel: 0,
  });
  setRecordSelectorControllerInContext(recordSelectorController);

  const clipboardHandlerStore = setNewClipboardHandlerStoreInContext();
  $: clipboardHandler = $clipboardHandlerStore;

  // Why are we handling clipboard events here?
  //
  // We originally implemented the clipboard handler lower down, in the Sheet
  // component. That worked for Firefox because when the user pressed Ctrl+C the
  // focused `.cell-wrapper` div node would emit a copy event. However, in
  // Chrome and Safari, the focused `.cell-wrapper` div node does _not_ emit
  // copy events! Perhaps that's because it doesn't contain any selected text?
  // Instead, the copy event gets emitted from `body` in Chrome/Safari.
  // Clipboard functionality seems inconsistent in subtle ways across browsers.
  // Make sure to test in all browsers when making changes!
  //
  // On a record page with multiple table widgets, we should be able to copy
  // cells from each table widget, and we should be able to copy plain text on
  // the page, outside of the sheet. We also need to support copying from the
  // Data Explorer.

  function handleCopy(e: ClipboardEvent) {
    if (clipboardHandler) {
      clipboardHandler.handleCopy(e);
      e.preventDefault();
    }
  }

  function handlePaste(e: ClipboardEvent) {
    if (clipboardHandler) {
      clipboardHandler.handlePaste(e);
      e.preventDefault();
    }
  }
</script>

<svelte:body on:copy={handleCopy} on:paste={handlePaste} />

<ToastPresenter entries={toast.entries} />
<Confirmation controller={confirmationController} />
<ModalRecordSelector
  {recordSelectorController}
  modalController={recordSelectorModal}
/>

<slot />
