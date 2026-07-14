<script lang="ts">
  import { api } from '@mathesar/api/rpc';
  import type { RawColumn } from '@mathesar/api/rpc/columns';
  import type { Table } from '@mathesar/models/Table';
  // import { arrayFactory } from '@mathesar/stores/abstract-types/abstractTypeCategories';
  // import { forceSimulation, forceManyBody, forceCenter, forceLink } from "d3-force";
  import { Node, Svelvet, ThemeToggle } from 'svelvet';
  export let tablesMap: Map<Table['oid'], Table>;
  let tables: Table[] = [];
  $: tables = [...tablesMap.values()];
  // $: columns = tables.forEach(async (table) => await api.columns.list({database_id: table.schema.database.id, table_oid: table.oid}));
  type TableWithColumns = {
    table: Table;
    columns: RawColumn[];
  };
  let tablesWithColumns: TableWithColumns[] = [];
  $: nodeData =
    tablesWithColumns.length > 0
      ? tablesWithColumns
      : tables.map((table) => ({ table, columns: [] }));

  async function loadColumns() {
    tablesWithColumns = await Promise.all(
      tables.map(async (table) => {
        const columns = await api.columns
          .list({
            database_id: table.schema.database.id,
            table_oid: table.oid,
          })
          .run();
        return { table, columns };
      }),
    );
  }
  $: if (tables.length) loadColumns();
  $: console.log('columnsByTable', tablesWithColumns);
  /* function autoLayoutERD(entities, relations) {
    const sim = forceSimulation(entities)
    .force("charge", forceManyBody().strength(-300))
    .force("center", forceCenter(600, 400))
    // .force("link", forceLink(relations).id(d => d.id).distance(150));
    
    return new Promise(resolve => {
      sim.on("end", () => resolve(entities.map(e => ({
        id: e.id,
        position: { x: e.x, y: e.y },
        data: { label: e.name }
      }))));
    });
  }
  $: entities = tables.map((t) => ({id: t.oid, name: t.name}));

  $: nodes = await autoLayoutERD(entities, []); */
  /* function getJoinableTablesResult(tableId: number) {
    return api.tables
      .list_joinable({
        database_id: table.schema.database.id,
        table_oid: tableId,
        max_depth: 1,
      })
      .run();
  } */
</script>

<Svelvet  id="canvas" height={700} controls fitView minimap>
  {#each nodeData as { table, columns }}
    <Node id={table.oid} bgColor="orange">
      <div>{table.name}</div>
      <table>
        <tr>
          <td>attnum</td>
          <td>name</td>
          <td>type</td>
        </tr>
        {#each columns as column}
        <tr>
          <td>{column.id}</td>
          <td>{column.name}</td>
          <td>{column.type}</td>
        </tr>
        {/each}
      </table>
    </Node>
  {/each}
  <ThemeToggle main="dark" alt="light" slot="toggle" />
</Svelvet>
