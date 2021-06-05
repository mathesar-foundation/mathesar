<script lang="ts" context="module">
  let id = 0;

  function getId() {
    id += 1;
    return id;
  }
</script>

<script lang="ts">
  import { createEventDispatcher } from 'svelte';
  import type { Tab } from './TabContainer';

  const dispatch = createEventDispatcher();
  const componentId = getId();

  export let tabs: Tab[] = [];
  export let activeTab: Tab = tabs[0];
  export let idKey = 'id';
  export let labelKey = 'label';
  export let linkKey = 'href';
  export let allowRemoval = false;
  export let preventDefault = false;
  export let getLink: (arg0: unknown) => string;

  function selectActiveTab(e: Event, tab: Tab) {
    activeTab = tab;
    dispatch('tabSelected', {
      tab,
      originalEvent: e,
    });
  }

  function removeTab(e: Event, index: number) {
    const removedTab = tabs.splice(index, 1);
    if (activeTab === removedTab[0]) {
      if (tabs[index]) {
        activeTab = tabs[index];
      } else if (tabs[index - 1]) {
        activeTab = tabs[index - 1];
      } else {
        activeTab = null;
      }
    }
    tabs = ([] as Tab[]).concat(tabs);
    dispatch('tabRemoved', {
      removedTab: removedTab[0],
      activeTab,
      originalEvent: e,
    });
  }

  function focusTab(e: Event) {
    (e.target as Node).parentElement.classList.add('focused');
  }

  function blurTab(e: Event) {
    (e.target as Node).parentElement.classList.remove('focused');
  }

  function checkAndPreventDefault(e: Event) {
    if (preventDefault) {
      e.preventDefault();
    }
  }

  function getTabURL(tab: Tab): string {
    return getLink ? getLink(tab) : tab[linkKey] as string || null;
  }
</script>

<div class="tab-container" role="navigation">
  <ul role="tablist" class="tabs">
    {#each tabs as tab, index (tab[idKey] || tab)}
      <li role="presentation" class="tab" class:active={activeTab === tab} tabindex="-1" 
          style={activeTab !== tab ? `width: ${Math.floor(100 / tabs.length)}%;` : null}>

        <a role="tab" href={getTabURL(tab) || '#'} tabindex="0"
            aria-selected={activeTab === tab} aria-disabled="{!!tab.disabled}"
            id={activeTab === tab ? `mtsr-${componentId}-tab` : null} data-tinro-ignore
            aria-controls={activeTab === tab ? `mtsr-${componentId}-tabpanel` : null}
            on:focus={focusTab} on:blur={blurTab} on:mousedown={(e) => selectActiveTab(e, tab)}
            on:click={checkAndPreventDefault}>
              <slot name="tab" {tab}>
                {tab[labelKey]}
              </slot>
        </a>

        {#if allowRemoval}
          <button type="button" aria-label="remove" class="remove"
            on:click={(e) => removeTab(e, index)}>
            &times;
          </button>
        {/if}
      </li>
    {/each}
  </ul>

  <div class="tab-content-holder">
    <div role="tabpanel" aria-hidden="false"
          id="mtsr-{componentId}-tabpanel"
          aria-labelledby="mtsr-{componentId}-tab"
          tabindex="0">
      {#if activeTab}
        <slot></slot>
      {/if}
    </div>
  </div>  
</div>

<style global lang="scss">
  @import "TabContainer.scss";
</style>
