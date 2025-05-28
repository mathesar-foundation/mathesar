<script lang="ts">
  import type { IconProps } from '@mathesar/component-library/types';
  import { iconExternalHyperlink } from '@mathesar/icons';
  import { Icon } from '@mathesar-component-library';

  export let href: string;
  export let icon: IconProps;
</script>

<div class="resource-card">
  <span>
    <a class="title" {href} target="_blank">
      <span class="icon-wrapper">
        <Icon {...icon} size="0.7em" class="resource-icon" />
      </span>
      <slot name="title" />
      <span class="external-link-wrapper">
        <Icon {...iconExternalHyperlink} size="0.7em" />
      </span>
    </a>
  </span>
  <div class="description"><slot name="description" /></div>
</div>

<style>
  .resource-card {
    border-radius: var(--border-radius-l);
    display: flex;
    flex-direction: column;
    gap: var(--sm4);
  }
  .icon-wrapper {
    display: inline-flex;
    align-items: center;
    justify-content: center;
    margin-right: var(--sm5);
    color: var(--resource-icon-color);
    background-color: var(--resource-icon-background);
    border-radius: 50%;
    padding: var(--sm3);
  }

  .title {
    font-weight: var(--font-weight-medium);
    font-size: var(--lg1);
    text-decoration: none;
    display: inline-flex;
    align-items: center;
    gap: var(--sm5);
    color: var(--text-color-primary);
  }

  .title:hover {
    text-decoration: underline;
  }
  .description {
    color: var(--text-color-secondary);
    flex: 1 0 auto;
  }

  .external-link-wrapper {
    margin-left: var(--sm3);
    color: var(--text-color-muted);
    display: inline-flex;
    align-items: center;
  }
</style>
