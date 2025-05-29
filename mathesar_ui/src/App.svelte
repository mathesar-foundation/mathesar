<script lang="ts">
  import { isLoading as isTranslationLoading, locale } from 'svelte-i18n';

  import { preloadCommonData } from '@mathesar/utils/preloadData';
  import '@mathesar/utils/polyfills';
  import { Spinner } from '@mathesar-component-library';

  import AppContext from './AppContext.svelte';
  import { initI18n } from './i18n';
  import RootRoute from './routes/RootRoute.svelte';

  const commonData = preloadCommonData();
  void initI18n(commonData.user.display_language ?? 'en');
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

  :root {
    --color-substring-match: var(--salmon-300);
    --color-substring-match-light: var(--salmon-100);
    --modal-record-selector-z-index: 50;

    /** Component theming */
    --Match__highlight-color: var(--color-substring-match);

    /* Typography variables */
    --font-family-base: 'Inter', system-ui, -apple-system, BlinkMacSystemFont,
      'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, 'Open Sans',
      'Helvetica Neue', sans-serif;
    --font-family-mono: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas,
      'Liberation Mono', 'Courier New', monospace;
    --line-height-base: 1.5;
    --letter-spacing-base: -0.011em;
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
    --cell-bg-color-base: var(--white);
    --cell-bg-color-error: var(--red-100);
    --cell-bg-color-header: var(--slate-100);
    --cell-bg-color-processing: var(--yellow-100);
    --cell-bg-color-disabled: var(--slate-100);
    --cell-bg-color-row-hover: var(--slate-100);
    --cell-bg-color-row-selected: var(--sky-200);

    --color-fk: var(--salmon-200);
    --color-error: var(--red-600);
    --cell-text-color-processing: var(--text-color-muted);
    --color-array-element: var(--sky-300);
    --color-fk-border: var(--salmon-400);

    --cell-border-horizontal: 1px solid var(--neutral-300);
    --cell-border-vertical: 1px solid var(--neutral-300);

    --page-padding-x: var(--lg1);
    --page-padding-y: var(--lg1);
    --page-padding: var(--page-padding-x) var(--page-padding-y);

    --outer-page-padding-for-inset-page: 0;
    --inset-page-padding: var(--lg5) var(--lg1);

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

    color: var(--text-color);

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
    --WithPanel__resizer-color: var(--stormy-500);
    --WithPanel__resizer-size: var(--sm4);
  }

  body.theme-dark {
    --cell-bg-mix-blend-mode: screen;
    --cell-bg-color-base: var(--slate-850);
    --cell-bg-color-error: var(--red-900);
    --cell-bg-color-header: var(--slate-800);
    --cell-bg-color-processing: var(--yellow-900);
    --cell-bg-color-disabled: var(--slate-800);
    --cell-bg-color-row-hover: var(--slate-800);
    --cell-bg-color-row-selected: var(--sky-900);

    --color-substring-match: var(--pumpkin-800);
    --color-substring-match-light: var(--pumpkin-950);

    --Match__highlight-color: var(--color-substring-match);

    --cell-border-horizontal: 1px solid var(--slate-700);
    --cell-border-vertical: 1px solid var(--slate-700);

    --color-fk: var(--pumpkin-800);
    --color-fk-border: var(--pumpkin-600);
    --color-error: var(--red-400);
    --cell-text-color-processing: var(--neutral-300);
    --color-array-element: var(--sky-400);
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
    border-top: 1px solid var(--border-color);
    display: block;
  }

  a {
    color: var(--link-color);
    text-decoration-thickness: 1px;
    text-underline-offset: 0.1em;
  }

  code {
    font-family: var(--font-family-mono);
    font-size: 85%;
    background: var(--neutral-100);
    padding: 0.2em 0.3em;
    border-radius: 0.2em;
    color: var(--text-color);

    body.theme-dark & {
      background: var(--neutral-900);
      border: 1px solid var(--neutral-700);
    }
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
    background: var(--neutral-100);
    border-radius: 3px;
    color: var(--text-color-muted);
    font-weight: bold;

    body.theme-dark & {
      background: var(--neutral-900);
      border: 1px solid var(--neutral-700);
    }
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
    background-color: var(--background-color);
  }
</style>
