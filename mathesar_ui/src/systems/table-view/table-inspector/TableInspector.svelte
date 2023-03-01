<script lang="ts">
  import { TabContainer } from '@mathesar/component-library';
  import { getTabularDataStoreFromContext } from '@mathesar/stores/table-data';
  import type { ComponentType } from 'svelte';
  import ColumnMode from './column/ColumnMode.svelte';
  import RecordMode from './record/RecordMode.svelte';

  import TableMode from './table/TableMode.svelte';

  type TabItem = { label: string; id: number; component: ComponentType };
  const tabs: TabItem[] = [
    {
      label: 'Table',
      component: TableMode,
      id: 1,
    },
    {
      label: 'Column',
      component: ColumnMode,
      id: 2,
    },
    {
      label: 'Record',
      component: RecordMode,
      id: 3,
    },
  ];

  let activeTab: TabItem;

  const tabularData = getTabularDataStoreFromContext();
  $: ({ selection } = $tabularData);
  $: ({ selectedCells } = selection);

  $: {
    // Explicit dependency
    $selectedCells;

    if (selection.isAnyColumnCompletelySelected()) {
      [, activeTab] = tabs;
    }

    if (selection.isAnyRowCompletelySelected()) {
      [, , activeTab] = tabs;
    }
  }

  function move(element) {
    return {
      destroy() {},
    };
  }

  function resize(element) {
    const left = document.createElement('div');
    left.direction = 'west';
    left.classList.add('grabber');
    left.classList.add('left');

    const grabbers = [left];

    let active = null,
        initialRect = null,
        initialPos = null;

    grabbers.forEach((grabber) => {
      element.appendChild(grabber);
      grabber.addEventListener('mousedown', onMousedown);
    });

    function onMousedown(event) {
      active = event.target;
      const rect = element.getBoundingClientRect();
      const parent = element.parentElement.getBoundingClientRect();

      console.log({ rect, parent });

      initialRect = {
        width: rect.width,
        height: rect.height,
        left: rect.left - parent.left,
        right: parent.right - rect.right,
        top: rect.top - parent.top,
        bottom: parent.bottom - rect.bottom,
      };
      initialPos = { x: event.pageX, y: event.pageY };
      active.classList.add('selected');
    }

    function onMouseup(event) {
      if (!active) return;

      active.classList.remove('selected');
      active = null;
      initialRect = null;
      initialPos = null;
    }

    function onMove(event) {
      if (!active) return;

      const direction = active.direction;
      let delta;

      if (direction.match('east')) {
        delta = event.pageX - initialPos.x;
        element.style.width = `${initialRect.width + delta}px`;
      }

      if (direction.match('west')) {
        delta = initialPos.x - event.pageX;
        element.style.left = `${initialRect.left - delta}px`;
        element.style.width = `${initialRect.width + delta}px`;
      }

      if (direction.match('north')) {
        delta = initialPos.y - event.pageY;
        element.style.top = `${initialRect.top - delta}px`;
        element.style.height = `${initialRect.height + delta}px`;
      }

      if (direction.match('south')) {
        delta = event.pageY - initialPos.y;
        element.style.height = `${initialRect.height + delta}px`;
      }
    }

    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onMouseup);

    return {
      destroy() {
        window.removeEventListener('mousemove', onMove);
        window.removeEventListener('mousemove', onMousedown);

        grabbers.forEach((grabber) => {
          element.removeChild(grabber);
        });
      },
    };
  }

  let grabber = true;
</script>

<main class:hide-grabber={!grabber}>
  <div class="table-inspector-container box" use:move use:resize>
    <TabContainer
      bind:activeTab
      {tabs}
      tabStyle="compact"
      fillContainerHeight
      fillTabWidth
    >
      <slot>
        {#if activeTab}
          <div class="tabs-container">
            <svelte:component this={activeTab.component} />
          </div>
        {/if}
      </slot>
    </TabContainer>
  </div>
</main>

<style lang="scss">
  .table-inspector-container {
    width: var(--table-inspector-width, 400px);
    box-shadow: 0px 2px 2px 0px rgba(0, 0, 0, 0.14),
      0px 3px 1px -2px rgba(0, 0, 0, 0.12), 0px 1px 5px 0px rgba(0, 0, 0, 0.2);
    position: relative;
    background-color: var(--sand-100);
    isolation: isolate;

    :global(.collapsible > .collapsible-header > button.btn) {
      background-color: var(--sand-200);

      &:hover {
        background-color: var(--sand-300);
      }

      &:active {
        background-color: var(--sand-400);
      }
    }
  }

  .box {
    height: 100%;
    display: flex;
    // justify-content: center;
    position: relative;
    // user-select: none;
  }

  :global(.grabber) {
    position: absolute;
    box-sizing: border-box;
    background-color: var(--sand-100);
  }

  :global(.grabber.left) {
    width: 10px;
    height: 100%;
    background: blue;
    left: -5px;
    cursor: col-resize;
  }
</style>
