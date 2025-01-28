<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconDatabase } from '@mathesar/icons';
  import { Icon, Tooltip } from '@mathesar-component-library';

  export let title: string | undefined = undefined;
  export let isDbLevelConfiguration = false;
</script>

<div class="collapsible-header-container">
  <div>
    <slot name="title">{title}</slot>
  </div>
  {#if isDbLevelConfiguration}
    <Tooltip aria-label={$_('help')} class="help-trigger" allowHover>
      <Icon slot="trigger" {...iconDatabase} />
      <span slot="content">{$_('section_affects_postgresql_config')}</span>
    </Tooltip>
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
