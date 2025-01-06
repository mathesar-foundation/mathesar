<script lang="ts">
  import Icon from '@mathesar-component-library-dir/icon/Icon.svelte';
  import type { IconProps } from '@mathesar-component-library-dir/icon/IconTypes';

  export let icon: IconProps;
  export let name: string;
  export let subText: string | undefined = undefined;
</script>

<div class="container">
  <div class="top">
    <div class="left">
      <div class="entity-container">
        <div class="entity-icon">
          <Icon {...icon} size="1.5em" />
        </div>
        <div class="left-meta-container">
          <span class="entity-name">{name}</span>
          {#if subText}
            <span>{subText}</span>
          {/if}
        </div>
      </div>
    </div>
    <slot name="action" />
  </div>
  <slot name="bottom" />
</div>

<style lang="scss">
  .container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }
  .top {
    display: flex;
    flex-direction: row;
    align-items: center;
    justify-content: space-between;
  }

  .entity-container {
    display: flex;
    flex-direction: row;
    align-items: center;
  }

  .entity-icon {
    width: 3.4rem;
    height: 3.4rem;
    background-color: var(--brand-500);
    display: flex;
    justify-content: center;
    align-items: center;
    border-radius: 50%;
    color: var(--white);
  }

  .left-meta-container {
    display: flex;
    flex-direction: column;
    margin-left: 0.75rem;
    gap: var(--size-super-ultra-small);
  }

  .entity-name {
    font-weight: 500;
    font-size: var(--text-size-xx-large);
    line-height: 1;
  }
</style>
