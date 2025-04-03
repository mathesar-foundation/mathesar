<script lang="ts">
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';

  export let icon: IconProps;
  export let name: string;
  export let entityTypeName: string | undefined = undefined;
</script>

<div class="page-title-and-meta">
  <div class="top">
    <div class="entity-container">
      <div class="left-meta-container">
        {#if entityTypeName}
          <div class="entity-type-container">
            <div class="entity-icon">
              <Icon {...icon} size="1em" />
            </div>
            <span class="entity-type-name">{entityTypeName}</span>
          </div>
        {/if}
        <span class="entity-name">{name}</span>
        <slot name="subText" />
      </div>
    </div>
    <div class="action">
      <slot name="action" />
    </div>
  </div>
  <slot name="bottom" />
</div>

<style lang="scss">
  .page-title-and-meta {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
  .top {
    display: flex;
    flex-wrap: wrap;
    gap: 1rem;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .entity-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .action {
    flex: 1 1 auto;
    display: flex;
    justify-content: flex-end;
  }

  .entity-icon {
    flex: 0 0 auto;
    display: flex;
    justify-content: center;
    align-items: center;
    color: var(--text-color-tertiary);
    margin-right: 0.25rem;
  }

  .entity-type-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .left-meta-container {
    display: flex;
    flex-direction: column;
    gap: var(--size-super-ultra-small);
  }

  .entity-type-name {
    font-size: var(--text-size-large);
    font-weight: 500;
    line-height: 1;
    color: var(--text-color-secondary);
  }

  .entity-name {
    font-weight: var(--font-weight-extra-bold);
    font-size: var(--text-size-super-ultra-large);
    line-height: 1;
    color: var(--text-color-primary);
  }
</style>
