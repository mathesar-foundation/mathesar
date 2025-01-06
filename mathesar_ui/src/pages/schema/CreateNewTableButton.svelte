<script lang="ts">
  import { _ } from 'svelte-i18n';

  import Icon from '@mathesar/component-library/icon/Icon.svelte';
  import LinkMenuItem from '@mathesar/component-library/menu/LinkMenuItem.svelte';
  import { iconAddNew } from '@mathesar/icons';
  import type { Database } from '@mathesar/models/Database';
  import type { Schema } from '@mathesar/models/Schema';
  import { getImportPageUrl } from '@mathesar/routes/urls';
  import { ButtonMenuItem, DropdownMenu } from '@mathesar-component-library';

  export let database: Database;
  export let schema: Schema;
  export let onCreateEmptyTable: () => void;

  $: ({ currentRolePrivileges } = schema.currentAccess);
</script>

<DropdownMenu
  showArrow={true}
  triggerAppearance="primary"
  closeOnInnerClick={true}
  label={$_('new_table')}
  disabled={!$currentRolePrivileges.has('CREATE')}
>
  <div slot="trigger">
    <Icon {...iconAddNew} />
    {$_('new_table')}
  </div>
  <ButtonMenuItem on:click={onCreateEmptyTable}>
    {$_('from_scratch')}
  </ButtonMenuItem>
  <LinkMenuItem href={getImportPageUrl(database.id, schema.oid)}>
    {$_('from_data_import')}
  </LinkMenuItem>
</DropdownMenu>
