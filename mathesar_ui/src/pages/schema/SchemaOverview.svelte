<script lang="ts">
  import type { QueryInstance } from '@mathesar/api/queries';
  import type { TableEntry } from '@mathesar/api/tables';
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';
  import { AnchorButton } from '@mathesar-component-library';
  import { getDataExplorerPageUrl } from '@mathesar/routes/urls';
  import OverviewHeader from './OverviewHeader.svelte';
  import TablesList from './TablesList.svelte';
  import ExplorationsList from './ExplorationsList.svelte';
  import CreateEmptyTableButton from './CreateEmptyTableButton.svelte';

  export let tablesMap: Map<number, TableEntry>;
  export let explorationsMap: Map<number, QueryInstance>;

  export let database: Database;
  export let schema: SchemaEntry;
</script>

<div class="container">
  <div class="vertical-container tables">
    <OverviewHeader title="Tables">
      <slot slot="action">
        <CreateEmptyTableButton {database} {schema}>
          New Table
        </CreateEmptyTableButton>
      </slot>
    </OverviewHeader>
    <TablesList tables={[...tablesMap.values()]} {database} {schema} />
  </div>
  <div class="vertical-container explorations">
    <div class="vertical-container">
      <OverviewHeader title="Saved Explorations" />
      <ExplorationsList
        bordered={false}
        explorations={[...explorationsMap.values()]}
        {database}
        {schema}
      />
    </div>

    <div class="vertical-container">
      <OverviewHeader title="Explore your Data" />
      <span>
        Explorations let you query your data to uncover trends and insights.
      </span>
      <div>
        <AnchorButton href={getDataExplorerPageUrl(database.name, schema.id)}>
          Open Data Explorer
        </AnchorButton>
      </div>
    </div>
  </div>
</div>

<style lang="scss">
  :root {
    --container-gap: 2rem;
  }
  .container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: var(--container-gap);
    }
  }

  .vertical-container {
    display: flex;
    flex-direction: column;

    > :global(* + *) {
      margin-top: 1rem;
    }
  }

  .explorations {
    > :global(* + *) {
      margin-top: 2rem;
    }
  }

  @media screen and (min-width: 64rem) {
    .container {
      flex-direction: row;

      > :global(* + *) {
        margin-left: var(--container-gap);
        margin-top: 0rem;
      }
    }
    .tables {
      flex-basis: 65%;
    }
    .explorations {
      flex-basis: 35%;
    }
  }
</style>
