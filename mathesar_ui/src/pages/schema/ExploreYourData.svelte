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

<!-- <Tutorial>
  <span slot="title">{$_('explore_your_data')}</span>
  <div slot="body">
    <div>{$_('what_is_an_exploration_mini')}</div>

    <AnchorButton {href} size="small">{$_('open_data_explorer')}</AnchorButton>
  </div>
</Tutorial> -->

<style lang="scss">
  .explore-your-data {
    padding: var(--lg3);
    background: linear-gradient(
      135deg,
      var(--pumpkin-200) 0%,
      var(--pumpkin-300) 100%
    );
    border: 1px solid var(--pumpkin-400);
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
      background: radial-gradient(
        circle at top right,
        rgba(255, 255, 255, 0.15) 0%,
        transparent 60%
      );
      pointer-events: none;
    }

    .explore-title {
      font-size: var(--lg1);
      font-weight: var(--font-weight-bold);
      color: var(--pumpkin-900);
      margin: 0 0 0.75rem 0;
      position: relative;
    }

    .explore-description {
      color: var(--pumpkin-800);
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
