<script lang="ts">
  import type { IconProps } from '@mathesar/component-library/types';
  import { iconExternalHyperlink } from '@mathesar/icons';
  import { AnchorButton, Icon } from '@mathesar-component-library';

  export let href: string;
  export let icon: IconProps;
</script>

<a class="resource-card" {href} target="_blank">
  <div class="title">
    <span>
      <Icon {...icon} />
      <slot name="title" />
    </span>
    <Icon {...iconExternalHyperlink} />
  </div>
  <div class="description"><slot name="description" /></div>
</a>

<style>
  .resource-card {
    border-radius: var(--border-radius-l);
    display: flex;
    flex-direction: column;
    gap: var(--size-ultra-small);
    text-decoration: none;
  }
  .title {
    font-weight: 500;
    text-decoration: underline;
  }
  .description {
    color: var(--color-text-muted);
    flex: 1 0 auto;
  }
</style>
