<script lang="ts">
  import { Icon } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let icon: IconProps;
  export let name: string;
  export let description: string | undefined = undefined;
  export let accentColor = '#eaec75';
</script>

<div class="entity-page-header">
  <div class="heading">
    <div class="icon" style:background={accentColor}>
      <Icon {...icon} size="1.7143rem" />
    </div>
    <div class="title">
      <h1>{name}</h1>
      {#if description}
        <span>{description}</span>
      {/if}
    </div>
  </div>
  <div class="actions" class:has-right-actions={$$slots['actions-right']}>
    {#if $$slots.default}
      <div class="actions-left">
        <slot />
      </div>
    {/if}
    {#if $$slots['actions-right']}
      <div class="actions-right">
        <slot name="actions-right" />
      </div>
    {/if}
  </div>
</div>

<style lang="scss">
  .entity-page-header {
    border-bottom: 1px solid var(--slate-300);
    background-color: var(--white);
    position: relative;
    display: flex;
    align-items: center;

    .heading {
      display: flex;
      border-right: 1px solid var(--slate-200);
      padding: var(--size-small) var(--size-large);
      align-items: center;
      min-width: 20rem;
      max-width: 30rem;
      flex-grow: 0;
      flex-shrink: 0;

      .icon {
        padding: var(--size-ultra-small);
        border-radius: var(--size-super-ultra-small);
        margin-right: var(--size-xx-small);
      }
      .title {
        display: flex;
        flex-direction: column;
        overflow: hidden;

        h1 {
          font-size: var(--text-size-large);
          margin: 0;
          font-weight: 600;
        }
        span {
          color: var(--slate-500);
        }
        h1,
        span {
          overflow: hidden;
          text-overflow: ellipsis;
          white-space: nowrap;
        }
      }
    }

    .actions {
      padding: 0 var(--size-large);
      display: flex;
      align-items: center;
      flex-grow: 1;

      .actions-left {
        display: flex;
      }

      &:not(.has-right-actions) {
        .actions-left {
          flex-grow: 1;
        }
      }

      .actions-right {
        margin-left: auto;
        display: flex;
      }
    }
  }
</style>
