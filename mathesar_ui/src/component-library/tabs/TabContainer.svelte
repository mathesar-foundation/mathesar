<script lang="ts" context="module">
  let id = 0;

  function getId() {
    id += 1;
    return id;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import TabComponent from './Tab.svelte';
  import type { Tab } from './TabContainerTypes';

  const dispatch = createEventDispatcher();
  const componentId = getId();

  export let tabs: Tab[] = [];
  export let activeTab: Tab | undefined = tabs[0];
  export let idKey = 'id';
  export let labelKey = 'label';
  export let allowRemoval = false;
  export let preventDefault = false;
  export let fillTabWidth = false;
  export let fillContainerHeight = false;
  export let uniformTabWidth = true;
  export let tabStyle = 'default';

  function selectActiveTab(e: Event, tab: Tab) {
    activeTab = tab;
    dispatch('tabSelected', {
      tab,
      originalEvent: e,
    });
  }

  function removeTab(e: { detail: Event }, index: number) {
    const removedTab = tabs.splice(index, 1);
    if (activeTab?.[idKey] === removedTab[0]?.[idKey]) {
      if (tabs[index]) {
        activeTab = tabs[index];
      } else if (tabs[index - 1]) {
        activeTab = tabs[index - 1];
      } else {
        // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
        activeTab = null;
      }
    }
    tabs = ([] as Tab[]).concat(tabs);
    dispatch('tabRemoved', {
      removedTab: removedTab[0],
      activeTab,
      originalEvent: e.detail,
    });
  }

  function focusTab(e: Event) {
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    (e.target as Node).parentElement.classList.add('focused');
  }

  function blurTab(e: Event) {
    // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
    (e.target as Node).parentElement.classList.remove('focused');
  }

  function checkAndPreventDefault(e: Event) {
    if (preventDefault) {
      e.preventDefault();
      const tab = (e.target as HTMLElement).closest('a[role="tab"]');
      (tab as HTMLElement)?.focus?.();
    }
  }
</script>

<div
  class="tab-container"
  role="navigation"
  class:fill-container-height={fillContainerHeight}
  class:compact={tabStyle === 'compact'}
>
  <ul role="tablist" class="tabs" class:fill-tab-width={fillTabWidth}>
    {#each tabs as tab, index (tab[idKey] || tab)}
      <TabComponent
        {componentId}
        {tab}
        {allowRemoval}
        {uniformTabWidth}
        totalTabs={tabs.length}
        isActive={tab[idKey] === activeTab?.[idKey]}
        on:focus={focusTab}
        on:blur={blurTab}
        on:click={checkAndPreventDefault}
        on:mousedown={(e) => selectActiveTab(e, tab)}
        on:remove={(e) => removeTab(e, index)}
      >
        <slot name="tab" {tab}>
          {tab[labelKey]}
        </slot>
      </TabComponent>
    {/each}
  </ul>

  <div class="tab-content-holder">
    <div
      role="tabpanel"
      aria-hidden="false"
      id="mtsr-{componentId}-tabpanel"
      aria-labelledby="mtsr-{componentId}-tab"
      tabindex="0"
    >
      {#if activeTab}
        <slot {activeTab} />
      {/if}
    </div>
  </div>
</div>

