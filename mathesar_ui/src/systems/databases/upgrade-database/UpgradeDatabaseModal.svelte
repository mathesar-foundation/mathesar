<script lang="ts">
  import { _ } from 'svelte-i18n';

  import RichText from '@mathesar/components/rich-text/RichText.svelte';
  import type { Database } from '@mathesar/models/Database';
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import UpgradeDatabaseForm from './UpgradeDatabaseForm.svelte';

  export let controller: ModalController<Database>;
  export let refreshDatabaseList: () => Promise<void> = async () => {};

  /**
   * When true, we think the DB is running the same version of Mathesar as the
   * service, and so we need to adjust some of the terminology to make more
   * sense to the user.
   */
  export let isReinstall = false;
</script>

<ControlledModal {controller} let:options={database}>
  <span slot="title">
    {#if isReinstall}
      <RichText text={$_('reinstall_mathesar_schemas_on_db')} let:slotName>
        {#if slotName === 'name'}
          <b>{database.name}</b>
        {/if}
      </RichText>
    {:else}
      <RichText text={$_('upgrade_database_with_name')} let:slotName>
        {#if slotName === 'name'}
          <b>{database.name}</b>
        {/if}
      </RichText>
    {/if}
  </span>
  <UpgradeDatabaseForm
    {database}
    {refreshDatabaseList}
    close={() => controller.close()}
    {isReinstall}
  />
</ControlledModal>
