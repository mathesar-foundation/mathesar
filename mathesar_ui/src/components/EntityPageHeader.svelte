<script lang="ts">
  import { Icon, Truncate } from '@mathesar-component-library';
  import type { IconProps } from '@mathesar-component-library/types';

  export let title:
    | {
        icon: IconProps;
        name: string;
        description?: string;
      }
    | undefined = undefined;
</script>

<div class="entity-page-header">
  {#if title}
    <div class="heading">
      <div class="icon">
        <Icon {...title.icon} class="block" />
      </div>
      <div class="text">
        <h1 class="name">
          <Truncate>{title.name}</Truncate>
        </h1>
        {#if title.description}
          <div class="description">
            <Truncate>{title.description}</Truncate>
          </div>
        {/if}
      </div>
    </div>
  {/if}
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
    min-height: 4.18214rem;

    .heading {
      display: flex;
      align-items: center;
      overflow: hidden;
      min-width: 15rem;
      max-width: 20rem;
      flex-grow: 0;
      flex-shrink: 0;
      min-height: 100%;
      border-right: 1px solid var(--slate-200);
      padding: var(--size-small) var(--size-large);

      .icon {
        font-size: 1.5rem;
        padding: var(--size-ultra-small);
        background: var(--EntityPageHeader__icon-background, var(--yellow-200));
        border-radius: var(--size-super-ultra-small);
        margin-right: var(--size-xx-small);
      }
      .text {
        overflow: hidden;
      }
      .name {
        font-size: var(--text-size-large);
        margin: 0;
        font-weight: 500;
        overflow: hidden;
      }
      .description {
        font-size: var(--text-size-small);
        color: var(--color-text-muted);
        overflow: hidden;
      }
    }

    .actions {
      padding: 0 var(--size-large);
      display: flex;
      align-items: center;
      flex-grow: 1;

      .actions-left {
        display: flex;
        flex-shrink: 0;

        > :global(* + *) {
          margin-left: var(--size-xx-small);
        }
      }

      &.has-right-actions {
        .actions-left {
          margin-right: var(--size-xx-small);
        }
      }

      &:not(.has-right-actions) {
        .actions-left {
          flex-grow: 1;
        }
      }

      .actions-right {
        margin-left: auto;
        display: flex;

        > :global(* + *) {
          margin-left: var(--size-xx-small);
        }
      }
    }
  }
</style>
