<script lang="ts">
  import { isLoading as isTranslationLoading, locale } from 'svelte-i18n';

  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import '@mathesar/utils/polyfills';
  import { Spinner } from '@mathesar-component-library';

  import AppContext from './AppContext.svelte';
  import { initI18n } from './i18n';
  import RootRoute from './routes/RootRoute.svelte';

  const commonData = preloadCommonData();
  const userDisplayLanguage =
    commonData.routing_context !== 'anonymous'
      ? commonData.user.display_language
      : null;
  void initI18n(userDisplayLanguage ?? 'en');
</script>

<AppContext {commonData}>
  {#if $isTranslationLoading}
    <div class="app-loader">
      <Spinner size="2rem" />
    </div>
  {:else}
    {#key $locale}
      <RootRoute {commonData} />
    {/key}
  {/if}
</AppContext>

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
  @import 'packages/new-item-highlighter/highlightNewItems.scss';

  $product-utility-colors: (
    'schema': $salmon,
    'database': $amethyst,
    'table': $pumpkin,
    'column': hsl(hue($salmon), 40%, 60%),
    'record': $asparagus,
    'record-fk': hsl(hue($asparagus), 80%, 60%),
    'exploration': $fjord,
    'data-form': $teal,
  );

  body {
    @each $name, $color in $product-utility-colors {
      @include generate-utility-color-tokens($name, $color);
    }

    --modal-record-selector-z-index: 50;

    /** Component theming */
    --Match__highlight-color: var(--text-highlight-elevated);

    /* Typography variables */
    --font-family-base: 'Inter', system-ui, -apple-system, BlinkMacSystemFont,
      'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    --font-family-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      'Liberation Mono', 'Courier New', monospace;
    --line-height-base: 1.5;
    --letter-spacing-base: -0.011em;

    /**
   * This sets the `mix-blend-mode` property for cell backgrounds.
   *
   * Why use color blending instead of opacity? Because I thought it would give
   * us an easier time keeping all our UI colors in sync. With blending, we
   * supply the exact same color value as we'd use for another places in the UI
   * where we expect the color to be opaque.
   */
    --cell-bg-mix-blend-mode: var(--mix-blend-mode);

    /**
   * This establishes a base background color for the cell when no additional
   * background colors are applied. We need this in case there is a background
   * color applied underneath the cell, e.g. on the table or page.
   */

    --cell-border-horizontal: 1px solid var(--border-grid);
    --cell-border-vertical: 1px solid var(--border-grid);

    --cell-bg-color-base: var(--color-surface-input);
    --cell-bg-color-error: var(--semantic-danger-bg);
    --cell-bg-color-header: var(--color-surface-header);
    --cell-bg-color-processing: var(--semantic-warning-bg);
    --cell-bg-color-disabled: var(--color-surface-input-disabled);
    --cell-bg-color-row-hover: var(--color-surface-input-hover);
    --cell-bg-color-row-selected: var(--color-selection-40);

    --cell-text-color-processing: var(--text-muted);

    --page-padding-x: var(--lg1);
    --page-padding-y: var(--lg1);
    --page-padding: var(--page-padding-x) var(--page-padding-y);

    --outer-page-padding-for-inset-page: 0;
    --inset-page-padding: var(--lg3) var(--sm1);

    --max-layout-width: 54rem;
    // For database page, schema page, and admin pages
    --max-layout-width-console-pages: 80rem;
    // For import upload, import preview pages
    --max-layout-width-data-pages: 67.357rem;

    // Setting the header height here
    // since when the header is fixed
    // we can use this variable to add margin-top
    // to the below header content container
    --header-height: 3rem;

    --table-title-header-height: 4.6428rem;
    --status-bar-padding: 0.5rem;

    color: var(--text-primary);

    --modal-z-index: 1;
    --dropdown-z-index: 1;
    --cell-errors-z-index: 1;
    --new-item-highlighter-z-index: 1;
    --toast-z-index: 3;
    --app-header-z-index: 1;

    overflow: hidden;
    height: 100vh;

    /* Apply typography base styles */
    font-family: var(--font-family-base);
    line-height: var(--line-height-base);
    letter-spacing: var(--letter-spacing-base);
    -webkit-font-smoothing: antialiased;
    -moz-osx-font-smoothing: neutralscale;
    text-rendering: optimizeLegibility;

    /** Panel theming */
    --WithPanel__gap: var(--sm3);
    --WithPanel__resizer-color: var(--semantic-help-icon);
    --WithPanel__resizer-size: var(--sm4);
  }

  h1 {
    margin: 0 0 1.5rem 0;
    font-size: var(--lg4);
    font-weight: 600;
    line-height: 1.2;
    letter-spacing: -0.02em;
  }

  h2 {
    font-size: var(--lg3);
    font-weight: 600;
    margin: 0 0 1rem 0;
    line-height: 1.3;
    letter-spacing: -0.015em;
  }

  h3 {
    font-size: var(--lg2);
    font-weight: 600;
    margin: 0 0 0.75rem 0;
    line-height: 1.4;
  }

  h4 {
    font-size: var(--size-medium);
    font-weight: 600;
    margin: 0 0 0.5rem 0;
    line-height: 1.4;
  }

  p {
    margin: 0 0 1rem 0;
  }

  hr {
    margin: 0;
    border: 0;
    border-top: 1px solid var(--border-section);
    display: block;
  }

  a {
    color: var(--text-link);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.1em;
  }

  code {
    font-family: var(--font-family-mono);
    font-size: 85%;
    background: var(--color-surface-input);
    padding: 0.2em 0.3em;
    border-radius: 0.2em;
    color: var(--text-primary);
  }

  ul {
    margin: 0;
  }

  .block {
    display: block;
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
    background: var(--color-surface-base);
    border-radius: 3px;
    color: var(--text-tertiary);
    font-weight: bold;
  }

  // TODO: remove this block when implementing
  // https://github.com/mathesar-foundation/mathesar/issues/4558
  .input:not(:has(.chip)) .null .postgres-keyword,
  .cell-wrapper:not(:has(.chip)) .postgres-keyword {
    color: var(--text-faint);
    font-weight: 300;
    background: transparent;
  }

  .bold-header {
    font-weight: 500;
  }

  .app-loader {
    width: 100vw;
    height: 100vh;
    align-items: center;
    justify-content: center;
    display: flex;
    background-color: var(--color-surface-base);
  }
</style>
