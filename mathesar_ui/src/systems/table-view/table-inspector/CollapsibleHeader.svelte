<script lang="ts">
  import { Dropdown, Icon } from '@mathesar/component-library';
  import { iconDatabase } from '@mathesar/icons';

  export let title: string;
  export let isDBLevelConfiguration = false;
</script>

<div class="container">
  <span>{title}</span>
  {#if isDBLevelConfiguration}
    <Dropdown
      ariaLabel="Help"
      placement="auto"
      showArrow={false}
      triggerAppearance="ghost"
      triggerClass="help-trigger"
      contentClass="help-content"
    >
      <span slot="trigger" class="help-trigger-content">
        <Icon {...iconDatabase} />
      </span>
      <slot slot="content"
        >This section affects the configuration of the database.</slot
      >
    </Dropdown>
  {/if}
</div>

<style lang="scss">
  .container {
    display: flex;
    align-items: center;
    justify-content: space-between;

    > :global(* + *) {
      margin-left: 0.5rem;
    }

    .help-trigger-content {
      color: var(--sand-800);
    }
  }
</style>
