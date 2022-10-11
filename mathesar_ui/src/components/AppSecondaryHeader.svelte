<script lang="ts">
  import type { ComponentProps } from 'svelte';
  import PageTitleAndMeta from './PageTitleAndMeta.svelte';

  export let pageTitleAndMetaProps: ComponentProps<PageTitleAndMeta>;
  export let maxWidth = true;
  // export let showTutorial: boolean = false;
</script>

<div class="container">
  <div class="content" class:max-width={maxWidth}>
    <div class="page-title-and-meta-container">
      <PageTitleAndMeta {...pageTitleAndMetaProps}>
        <slot slot="action" name="action" />
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
    background-color: var(--slate-400);
    padding: 2rem;
  }
  .content.max-width {
    max-width: var(--max-layout-width, 700px);
    margin-left: auto;
    margin-right: auto;
  }
  /* .tutorial-contianer {
    margin-top: 2rem;
  } */
</style>
