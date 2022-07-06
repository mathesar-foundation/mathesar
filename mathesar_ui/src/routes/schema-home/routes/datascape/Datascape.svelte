<script lang="ts">
  import { faTable } from '@fortawesome/free-solid-svg-icons';
  import { TabContainer, Icon } from '@mathesar-component-library';
  import {
    getTabsForSchema,
    tabIsTabular,
    TabType,
  } from '@mathesar/stores/tabs';
  import { constructTabularTabLink } from '@mathesar/stores/tabs/tabDataSaver';
  import type { MathesarTab, TabList } from '@mathesar/stores/tabs/types';

  import ImportData from './import-data/ImportData.svelte';
  import TableView from './table-view/TableView.svelte';

  export let database: string;
  export let schemaId: number;

  let tabList: TabList;
  $: tabList = getTabsForSchema(database, schemaId);
  $: ({ tabs, activeTab } = tabList);

  function getTabLink(tab: MathesarTab): string | undefined {
    if (!tabIsTabular(tab)) {
      return undefined;
    }
    return constructTabularTabLink(
      database,
      schemaId,
      tab.tabularData.type,
      tab.tabularData.id,
    );
  }

  function tabRemoved(e: { detail: { removedTab: MathesarTab } }) {
    tabList.removeTabAndItsData(e.detail.removedTab);
  }

  // @ts-ignore: https://github.com/centerofci/mathesar/issues/1055
  // eslint-disable-next-line @typescript-eslint/naming-convention
  const getLink__withTypeCoercion: (arg0: unknown) => string = getTabLink;
</script>

{#if $tabs?.length > 0}
  <div class="datascape">
    <TabContainer
      bind:tabs={$tabs}
      bind:activeTab={$activeTab}
      allowRemoval={true}
      preventDefault={true}
      getLink={getLink__withTypeCoercion}
      on:tabRemoved={tabRemoved}
    >
      <span slot="tab" let:tab>
        <Icon data={faTable} />
        <span>{tab.label}</span>
      </span>

      {#if $activeTab}
        {#if $activeTab.type === TabType.Import}
          <ImportData {database} {schemaId} id={$activeTab.fileImportId} />
        {:else if $activeTab.type === TabType.Tabular}
          <TableView tabularData={$activeTab.tabularData} />
        {/if}
      {/if}
    </TabContainer>
  </div>
{/if}

<style global lang="scss">
  .datascape {
    position: absolute;
    top: 0;
    right: 0;
    bottom: 0;
    left: 0;
    overflow: auto;

    .tab-container {
      position: absolute;
      left: 5px;
      right: 5px;
      bottom: 5px;
      top: 5px;

      .tabs {
        .tab {
          > a {
            > span {
              display: flex;
              align-items: center;
              overflow: hidden;

              > span {
                margin-left: 6px;
                display: block;
                flex-grow: 1;
                overflow: hidden;
                text-overflow: ellipsis;
                white-space: nowrap;
              }
            }
          }
        }
      }

      .tab-content-holder {
        flex-grow: 1;
        background: #fff;

        > div {
          position: absolute;
          left: 0;
          top: 0;
          width: 100%;
          height: 100%;
          overflow: hidden;
          display: flex;
          flex-direction: column;
        }
      }
    }
  }
</style>
