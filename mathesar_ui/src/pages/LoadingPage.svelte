<script lang="ts">
  import { _ } from 'svelte-i18n';

  import LayoutWithHeader from '@mathesar/layouts/LayoutWithHeader.svelte';
  import { Spinner } from '@mathesar-component-library';
</script>

<LayoutWithHeader>
  <div class="loading-page-container">
    <Spinner />
    <div>
      <slot />
    </div>
  </div>
</LayoutWithHeader>

<style lang="scss">
  .loading-page-container {
    margin-top: var(--lg2);
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
  }
</style>
