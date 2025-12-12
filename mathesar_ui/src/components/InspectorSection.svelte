<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconDatabase } from '@mathesar/icons';
  import { Collapsible, Icon, Tooltip } from '@mathesar-component-library';

  export let title: string | undefined = undefined;
  export let isDbLevelConfiguration = false;
  export let isOpen = true;
</script>

<div class="inspector-section">
  <Collapsible bind:isOpen triggerAppearance="default">
    <div slot="header" class="header">
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

    <div slot="content" class="content">
      <slot />
    </div>
  </Collapsible>
</div>

<style lang="scss">
  .content {
    padding: var(--sm1);
    display: flex;
    flex-direction: column;
    gap: var(--sm4);
  }

  .header {
    display: flex;
    align-items: center;
    justify-content: space-between;

    > :global(* + *) {
      margin-left: var(--sm4);
    }
  }
</style>
