<script lang="ts">
  import { Help } from '@mathesar-component-library';
  import WarningBox from '@mathesar/components/message-boxes/WarningBox.svelte';
  import type { UserModel } from '@mathesar/stores/users';
  import { getSchemasStoreForDB } from '@mathesar/stores/schemas';
  import { getUsersStoreFromContext } from '@mathesar/stores/users'; 
  import type { Database, SchemaEntry } from '@mathesar/AppTypes';

  export let database : Database;
  export let schema : SchemaEntry;
  export let userId: UserModel['id']
  const usersStore = getUsersStoreFromContext();
  $: user = usersStore?.getUserDetails(userId);
  export let userWithRole : UserModel['schemaRoles'];
  $: schemaStore = getSchemasStoreForDB(user?.databaseId);
</script>

<div class="user-permission-form">
  <div>
    <span>Permissions</span>
    <Help>User Permissions</Help>
  </div>
  {#if !userWithRole }
    <div class="user-without-permission">
      <WarningBox fullWidth>
        Please navigate to the appropriate database or schema in order to grant
        access to the user.
      </WarningBox>
    </div>
  {:else}
  <div>
    {database.name} / {schmema.name}
  </div>
  {/if}
</div>

<style lang="scss">
  .user-permission-form {
    display: flex;
    align-items: center;
    justify-content: center;
    margin-left: var(--size-large);
  }
  .user-without-permission {
    margin-left: var(--size-large);
  }
</style>
