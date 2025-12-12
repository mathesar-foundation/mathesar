<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { AnchorButton } from '@mathesar-component-library';

  export let href: string;
</script>

<div class="explore-your-data">
  <h3 class="explore-title">{$_('explore_your_data')}</h3>
  <p class="explore-description">
    {$_('what_is_an_exploration_mini')}
  </p>
  <div>
    <AnchorButton {href} size="small">
      {$_('open_data_explorer')}
    </AnchorButton>
  </div>
</div>

<style lang="scss">
  .explore-your-data {
    padding: var(--lg3);
    border-radius: var(--sm2);
    position: relative;
    overflow: hidden;

    &::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      --color: color-mix(in srgb, var(--color-fg-base), transparent 92%);
      background: radial-gradient(
        circle at bottom right,
        var(--color) 0%,
        transparent 60%
      );
      pointer-events: none;
    }

    .explore-title {
      font-size: var(--lg1);
      font-weight: var(--font-weight-bold);
      margin: 0 0 0.75rem 0;
      position: relative;
    }

    .explore-description {
      font-size: 1rem;
      margin: 0 0 1.5rem 0;
      position: relative;
      line-height: 1.5;
    }

    > div {
      position: relative;
    }
  }
</style>
