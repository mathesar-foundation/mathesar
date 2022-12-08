<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import PageTitleAndMeta from './PageTitleAndMeta.svelte';

  export let pageTitleAndMetaProps: ComponentProps<PageTitleAndMeta>;
  export let restrictWidth = true;
  export let theme: 'dark' | 'light' = 'dark';
  // export let showTutorial: boolean = false;
</script>

<div
  class="container"
  class:theme-dark={theme === 'dark'}
  class:theme-light={theme === 'light'}
>
  <div class="content" class:restrict-width={restrictWidth}>
    <div class="page-title-and-meta-container">
      <PageTitleAndMeta {...pageTitleAndMetaProps}>
        <slot slot="action" name="action" />
        <slot slot="bottom" name="bottom" />
      </PageTitleAndMeta>
    </div>
    <!-- {#if showTutorial}
      <div class="tutorial-contianer">
        <slot name="tutorial" />
      </div>
    {/if} -->
  </div>
</div>

<style>
  .container {
    padding: var(--page-padding);
  }
  .theme-dark {
    background-color: var(--slate-500);
    color: var(--white);
  }
  .theme-light {
    background-color: var(--sand-200);
  }
  .content.restrict-width {
    max-width: var(--max-layout-width, 54rem);
    margin-left: auto;
    margin-right: auto;
  }
  /* .tutorial-contianer {
    margin-top: 2rem;
  } */
</style>
