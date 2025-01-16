<script lang="ts">
  import type { IconProps } from '@mathesar/component-library/types';
  import { iconExternalHyperlink } from '@mathesar/icons';
  import { AnchorButton, Icon } from '@mathesar-component-library';

  export let href: string;
  export let icon: IconProps;
</script>

<div class="resource-card">
  <div class="title"><Icon {...icon} /> <slot name="title" /></div>
  <div class="description"><slot name="description" /></div>
  <div class="button">
    <AnchorButton appearance="secondary" {href} target="_blank">
      <slot name="link-text" />
      <Icon {...iconExternalHyperlink} />
    </AnchorButton>
  </div>
</div>

<style>
  .resource-card {
    border: 1px solid var(--sand-300);
    border-radius: var(--border-radius-l);
    padding: var(--size-large);
    display: flex;
    flex-direction: column;
    gap: var(--size-x-small);
    background: var(--white);
  }
  .title {
    font-weight: 500;
  }
  .description {
    color: var(--color-text-muted);
    flex: 1 0 auto;
  }
</style>
