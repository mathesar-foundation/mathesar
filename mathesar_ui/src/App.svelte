<script lang="ts">
  import { ToastPresenter, Confirmation } from '@mathesar-component-library';
  import { toast } from '@mathesar/stores/toast';
  import {
    RecordSelectorController,
    setRecordSelectorControllerInContext,
  } from '@mathesar/systems/record-selector/RecordSelectorController';
  import { confirmationController } from '@mathesar/stores/confirmation';
  import { modal } from './stores/modal';
  import ModalRecordSelector from './systems/record-selector/ModalRecordSelector.svelte';
  import RootRoute from './routes/RootRoute.svelte';

  const recordSelectorModal = modal.spawnModalController();
  const recordSelectorController = new RecordSelectorController({
    onOpen: () => recordSelectorModal.open(),
    onClose: () => recordSelectorModal.close(),
    nestingLevel: 0,
  });
  setRecordSelectorControllerInContext(recordSelectorController);
</script>

<ToastPresenter entries={toast.entries} />
<Confirmation controller={confirmationController} />
<ModalRecordSelector
  {recordSelectorController}
  modalController={recordSelectorModal}
/>

<RootRoute />

<!--
  Supporting aliases in scss within the preprocessor is a bit of work.
  I looked around to try to get it done but it didn't seem important to
  spend time figuring this out.

  The component-library style import would only ever be from App.svelte
  and when the library is moved to a separate package, we wouldn't have to
  worry about aliases.
-->
<style global lang="scss">
  @import 'component-library/styles.scss';

  :root {
    /** BASE COLORS **/
    --color-white: #ffffff;
    --color-blue-light: #e6f0ff;
    --color-blue-medium: #3b82f6;
    --color-blue-dark: #1d4ed8;
    --color-orange-dark: #7c2d12;
    --color-green-medium: #10b981;
    --color-gray-lighter: #fafafa;
    --color-gray-light: #f4f4f5;
    --color-gray-medium: #d4d4d8;
    --color-gray-dark: #a1a1aa;
    --color-gray-darker: #27272a;
    --color-contrast: var(--color-blue-medium);
    --color-contrast-light: var(--color-blue-light);
    --color-link: var(--color-blue-dark);
    --color-text: #171717;
    --color-text-muted: #6b7280;
    --text-size-xx-small: var(--size-xx-small); // 8px
    --text-size-x-small: var(--size-x-small); // 10px
    --text-size-small: var(--size-small); // 12px
    --text-size-base: var(--size-base); // 14px
    --text-size-large: var(--size-large); // 16px
    --text-size-xx-large: var(--size-xx-large); // 20px

    --modal-z-index: 50;
    --modal-record-selector-z-index: 50;
  }

  body {
    /**
   * This sets the `mix-blend-mode` property for cell backgrounds.
   *
   * Why use color blending instead of opacity? Because I thought it would give
   * us an easier time keeping all our UI colors in sync. With blending, we
   * supply the exact same color value as we'd use for another places in the UI
   * where we expect the color to be opaque.
   *
   * If/when we implement dark mode, we'll need to toggle this property to
   * something like `screen` or `lighten` so that as more backgrounds are
   * applied, the resulting blended background gets lighter instead of darker.
   */
    --cell-bg-mix-blend-mode: multiply;
    /**
   * This establishes a base background color for the cell when no additional
   * background colors are applied. We need this in case there is a background
   * color applied underneath the cell, e.g. on the table or page.
   */
    --cell-bg-color-base: white;
    --cell-bg-color-error: #fef1f1;
    --cell-bg-color-header: #f9f9f9;
    --cell-bg-color-processing: #fefef1;
    --cell-bg-color-disabled: var(--sand-100);
    --cell-bg-color-row-hover: #f6f7f7;
    --cell-bg-color-row-selected: #e4f2ff;

    --color-fk: var(--yellow-300);
    --color-error: #f47171;
    --cell-text-color-processing: #888;
    --color-array-element: #c1e8e8;

    --cell-border-horizontal: 1px solid var(--slate-200);
    --cell-border-vertical: 1px solid var(--slate-200);

    --page-padding: 1em;

    --max-layout-width: 54rem;
    // Setting the header height here
    // since when the header is fixed
    // we can use this variable to add margin-top
    // to the below header content container
    --header-height: 3.7378rem;

    --table-title-header-height: 4.6428rem;

    color: var(--slate-800);

    --modal-z-index: 1;
    --dropdown-z-index: 1;
    --cell-errors-z-index: 1;
    --toast-z-index: 2;
    --app-header-z-index: 1;

    overflow: hidden;
    height: 100vh;
  }

  h1 {
    margin: 0 0 1rem 0;
    font-size: 1.6rem;
  }

  .block {
    display: block;
  }

  .trim-child-margins > :first-child {
    margin-top: 0;
  }
  .trim-child-margins > :last-child {
    margin-bottom: 0;
  }

  /**
   * Used to turn elements like `<button>` and `<a>` into plain elements that
   * don't have any browser styling but still have functionality.
   */
  .passthrough {
    background: none;
    border-radius: 0;
    border: none;
    color: inherit;
    cursor: inherit;
    font-family: inherit;
    font-size: inherit;
    font-weight: inherit;
    text-align: inherit;
    text-decoration: inherit;
    margin: 0;
    padding: 0;
  }

  .postgres-keyword {
    font-size: 80%;
    padding: 0.02em 0.3em;
    background: rgba(0, 0, 0, 0.1);
    border-radius: 3px;
    color: rgba(0, 0, 0, 0.6);
    font-weight: bold;
  }
</style>
