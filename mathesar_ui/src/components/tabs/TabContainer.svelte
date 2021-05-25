<script lang="ts" context="module">
  let id = 0;

  function getId() {
    id += 1;
    return id;
  }
</script>

<script lang="ts">
  import type { Tab } from './TabContainer';

  export let tabs: Tab[] = [];
  export let idKey = 'id';
  export let labelKey = 'label';
  export let allowRemoval = false;

  const componentId = getId();
  export let activeTab: Tab = tabs[0];

  function selectActiveTab(tab: Tab) {
    activeTab = tab;
  }

  function removeTab(index: number) {
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
  }
</script>

<div class="tab-container" role="navigation">
  <ul role="tablist" class="tabs" >
    {#each tabs as tab, index (tab[idKey] || tab)}
      <li role="presentation" tabindex="-1" class="tab" class:active={activeTab === tab}
          on:mousedown={() => selectActiveTab(tab)}
          style={activeTab !== tab ? `width: ${Math.floor(100 / tabs.length)}%;` : null}>

        <a role="tab" tabindex="0" href={tab.href || '#'}
            aria-selected={activeTab === tab} aria-disabled="{!!tab.disabled}"
            id={activeTab === tab ? `mtsr-${componentId}-tab` : null}
            aria-controls={activeTab === tab ? `mtsr-${componentId}-tabpanel` : null}>
          {tab[labelKey]}
        </a>

        {#if allowRemoval}
          <button type="button" aria-label="remove" class="remove"
            on:mousedown|preventDefault|stopPropagation
            on:click={() => removeTab(index)}>
            &times;
          </button>
        {/if}
      </li>
    {/each}
  </ul>

  <div class="tab-content-holder">
    <div role="tabpanel" aria-hidden="false"
          id="mtsr-{componentId}-tabpanel-active"
          aria-labelledby="mtsr-{componentId}-tab-active"
          tabindex="0">
      {#if activeTab}
        <slot {activeTab}></slot>
      {/if}
    </div>
  </div>  
</div>

<style global lang="scss">
  @import "TabContainer.scss";
</style>
