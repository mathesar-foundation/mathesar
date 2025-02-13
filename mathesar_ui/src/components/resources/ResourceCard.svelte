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
      <span class="icon">
        <Icon {...icon} size="0.8em" />
      </span>
      <slot name="title" />
      <Icon {...iconExternalHyperlink} />
    </a>
  </span>
  <div class="description"><slot name="description" /></div>
</div>

<style>
  .resource-card {
    border-radius: var(--border-radius-l);
    display: flex;
    flex-direction: column;
    gap: var(--size-ultra-small);
  }
  .icon {
    display: inline-flex;
    align-items: center;
    padding: var(--size-ultra-small);
    border-radius: 50%;
    background-color: var(--yellow-400);
    color: var(--white);
  }
  .title {
    font-weight: 600;
    text-decoration: underline;
    display: inline-flex;
    align-items: center;
    gap: var(--size-super-ultra-small);
  }
  .description {
    color: var(--color-text-muted);
    flex: 1 0 auto;
  }
</style>
