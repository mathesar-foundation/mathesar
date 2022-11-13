<script lang="ts">
  import { TabContainer } from '@mathesar-component-library';
  import type QueryRunner from '../QueryRunner';

  export let queryRunner: QueryRunner;
  $: ({ query } = queryRunner);
  $: isSaved = $query.isSaved();

  const generalTabs = [
    { id: 'inspect-column', label: 'Column' },
    { id: 'inspect-cell', label: 'Cell' },
  ];
  const tabsWhenQueryIsSaved = [
    { id: 'inspect-exploration', label: 'Exploration' },
    ...generalTabs,
  ];
  $: tabs = isSaved ? tabsWhenQueryIsSaved : generalTabs;
</script>

<aside class="exploration-inspector">
  <TabContainer {tabs} fillTabWidth fillContainerHeight let:activeTab>
    <div />
  </TabContainer>
</aside>

<style lang="scss">
  aside.exploration-inspector {
    width: var(--exploration-inspector-width);
    flex-basis: var(--exploration-inspector-width);
    border-left: 1px solid var(--slate-300);
    background: var(--sand-100);
    flex-shrink: 0;
    flex-grow: 0;
    display: flex;
    flex-direction: column;
    overflow: hidden;
  }
</style>
