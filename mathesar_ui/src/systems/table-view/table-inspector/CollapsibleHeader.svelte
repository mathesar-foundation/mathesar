<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconDatabase } from '@mathesar/icons';
  import { Icon } from '@mathesar-component-library';

  export let title: string;
  export let isDbLevelConfiguration = false;
</script>

<div class="collapsible-header-container">
  <span>{title}</span>
  {#if isDbLevelConfiguration}
    <Icon {...iconDatabase} title={$_('section_affects_database_config')} />
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
