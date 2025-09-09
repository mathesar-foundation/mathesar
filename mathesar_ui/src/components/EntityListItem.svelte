<script lang="ts">
  import { iconDescription, iconMoreActions } from '@mathesar/icons';
  import {
    DropdownMenu,
    Icon,
    Tooltip,
    Truncate,
    makeStyleStringFromCssVariables,
  } from '@mathesar-component-library';
  import type {
    CssVariablesObj,
    IconProps,
  } from '@mathesar-component-library/types';

  export let href: string;
  export let icon: IconProps;
  export let name: string;
  export let description: string | undefined = undefined;
  /**
   * If this entity is in a pending state, the given message will explain why
   * (e.g. an unconfirmed table import).
   */
  export let pendingMessage: string | undefined = undefined;
  export let primary = false;
  export let cssVariables: CssVariablesObj | undefined = undefined;

  $: style = cssVariables
    ? makeStyleStringFromCssVariables(cssVariables)
    : undefined;
</script>

<div
  class="entity-list-item"
  class:pending={!!pendingMessage}
  class:primary
  {style}
>
  <a class="link passthrough" {href} aria-label={name}>
    <div class="top">
      <div class="name">
        <span class="icon">
          <Icon {...icon} />
        </span>
        <span>{name}</span>
      </div>
      {#if description && !primary}
        <Tooltip>
          <div class="description-icon" slot="trigger">
            <Icon {...iconDescription} />
          </div>
          <div slot="content">{description}</div>
        </Tooltip>
      {/if}
      {#if pendingMessage}
        <div class="pending-message">
          {pendingMessage}
        </div>
      {/if}
    </div>
    {#if description && primary}
      <div class="description">
        <Truncate>{description}</Truncate>
      </div>
    {/if}
    {#if $$slots.detail}
      <div class="detail">
        <slot name="detail" />
      </div>
    {/if}
  </a>

  {#if $$slots['action-buttons'] || $$slots.menu}
    <div class="actions">
      <slot name="action-buttons" />
      {#if $$slots.menu}
        <div class="menu-container">
          <DropdownMenu
            showArrow={false}
            triggerAppearance="plain"
            triggerClass="dropdown-menu-button"
            closeOnInnerClick={true}
            placements={['bottom-end', 'right-start', 'left-start']}
            label=""
            icon={iconMoreActions}
            size="small"
          >
            <slot name="menu" />
          </DropdownMenu>
        </div>
      {/if}
    </div>
  {/if}
</div>

<style lang="scss">
  .entity-list-item {
    position: relative;
    display: grid;
    grid-template: auto / 1fr auto;
    align-items: center;
    overflow: hidden;
    border-radius: var(--corner-tl) var(--corner-tr) var(--corner-br)
      var(--corner-bl);
    --corner-tl: 0;
    --corner-tr: 0;
    --corner-br: 0;
    --corner-bl: 0;

    --EntityListItem__internal-accent-color: var(
      --EntityListItem__accent-color,
      var(--text-icon)
    );
  }

  .entity-list-item.primary {
    border: 1px solid var(--card-border-color);
    background-color: var(--card-background);

    & + :global(.entity-list-item.primary) {
      border-top: 1px solid transparent;
    }

    &:first-child {
      --corner-tl: var(--border-radius-l);
      --corner-tr: var(--border-radius-l);
    }
    &:last-child {
      --corner-br: var(--border-radius-l);
      --corner-bl: var(--border-radius-l);
    }
  }
  .entity-list-item:not(.primary) {
    --corner-tl: var(--border-radius-l);
    --corner-tr: var(--border-radius-l);
    --corner-br: var(--border-radius-l);
    --corner-bl: var(--border-radius-l);
  }

  .entity-list-item:has(.link:focus) {
    outline: 1px solid var(--card-focus-outline-color);
    outline-offset: 2px;
    z-index: 1;
    box-shadow: var(--card-focus-box-shadow);
  }

  .entity-list-item:has(.link:hover) {
    background: color-mix(
      in srgb,
      var(--EntityListItem__internal-accent-color),
      transparent 90%
    );
  }

  .entity-list-item:has(.link:hover) {
    padding-left: 0;

    &::before {
      content: '';
      border-radius: var(--corner-tl) var(--corner-tr) var(--corner-br)
        var(--corner-bl);
      border-left: solid 3px var(--EntityListItem__internal-accent-color);
      position: absolute;
      height: 100%;
      width: 10px;
      top: 0;
      left: 0;
      pointer-events: none;
    }
  }

  .link {
    overflow: hidden;
    display: grid;
    cursor: pointer;
    padding: var(--sm2) var(--sm2);

    .top {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: var(--sm2);
    }

    .detail {
      margin: var(--sm6) 0 0 var(--lg1);
      font-size: var(--sm1);
      color: var(--text-disabled);
    }
  }
  .entity-list-item.primary .link {
    padding: var(--sm2) var(--lg1);
  }

  .name {
    font-weight: var(--font-weight-medium);

    .icon {
      color: var(--EntityListItem__internal-accent-color);
    }
  }
  .entity-list-item.primary .name {
    font-size: var(--lg1);
  }

  .description {
    overflow: hidden;
  }
  .description-icon {
    color: var(--text-disabled);
    font-size: var(--sm1);
  }

  .pending-message {
    font-size: var(--sm1);
    padding: 0.25rem 0.5rem;
    border: 1px solid var(--semantic-warning-border);
    border-radius: var(--border-radius-l);
    background: var(--semantic-warning-bg);
    color: var(--semantic-warning-text);
  }

  .actions {
    display: flex;
    align-items: center;
    gap: 0.75rem;
    padding: 0.75rem 1rem;
  }

  .menu-container {
    display: flex;
  }
</style>
