<script lang="ts">
  import { Menu, LinkMenuItem, MenuHeading } from '@mathesar-component-library';
  import { databases } from '@mathesar/stores/databases';
  import { getDatabasePageUrl } from '@mathesar/routes/urls';
  import DatabaseName from '@mathesar/components/DatabaseName.svelte';
</script>

<Menu
  cssVariables={{
    '--min-width': '100%',
    '--Menu__item-hover-background': 'var(--sand-200)',
    '--icon-color': 'var(--brand-500);',
    '--NameWithIcon__icon-opacity': '1',
  }}
>
  <MenuHeading>
    All Databases ({$databases.data.length})
  </MenuHeading>
  {#each $databases.data as database (database.name)}
    <LinkMenuItem href={getDatabasePageUrl(database.name)}>
      <DatabaseName {database} iconHasBox />
    </LinkMenuItem>
  {/each}
</Menu>
