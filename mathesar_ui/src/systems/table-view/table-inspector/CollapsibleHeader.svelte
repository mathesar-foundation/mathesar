<script lang="ts">
  import { Icon } from '@mathesar/component-library';
  import { iconDatabase } from '@mathesar/icons';

  export let title: string;
  export let isDbLevelConfiguration = false;
</script>

<div class="collapsible-header-container">
  <span>{title}</span>
  {#if isDbLevelConfiguration}
    <Icon
      {...iconDatabase}
      title="This section affects the configuration of the database."
    />
  {/if}
</div>

<style lang="scss">
  .collapsible-header-container {
    display: flex;
    align-items: center;
    justify-content: space-between;

    :global(svg) {
      color: var(--sand-800);
    }

    > :global(* + *) {
      margin-left: 0.5rem;
    }
  }
</style>
