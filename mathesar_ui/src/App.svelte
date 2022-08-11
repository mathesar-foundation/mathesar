<script lang="ts">
  import { ToastPresenter, Confirmation } from '@mathesar-component-library';
  import { toast } from '@mathesar/stores/toast';
  import { setNewRecordSelectorControllerInContext } from '@mathesar/systems/record-selector/RecordSelectorController';
  import { confirmationController } from '@mathesar/stores/confirmation';
  import { getTableName } from '@mathesar/stores/tables';
  import { modal } from './stores/modal';
  import RecordSelectorModal from './systems/record-selector/RecordSelectorModal.svelte';
  import RootRoute from './routes/RootRoute.svelte';

  const recordSelectorController = setNewRecordSelectorControllerInContext({
    modal: modal.spawnModalController(),
    getTableName,
  });
</script>

<ToastPresenter entries={toast.entries} />
<Confirmation controller={confirmationController} />
<RecordSelectorModal controller={recordSelectorController} />

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
    --cell-bg-color-disabled: #f3f3f3;
    --cell-bg-color-row-hover: #f6f7f7;
    --cell-bg-color-row-selected: #e4f2ff;

    --cell-text-color-processing: #888;

    --cell-border-horizontal: 1px solid #e7e7e7;
    --cell-border-vertical: 1px solid #efefef;

    --page-padding: 1em;
  }

  h1 {
    margin: 0 0 1rem 0;
    font-size: 1.6rem;
  }
</style>
