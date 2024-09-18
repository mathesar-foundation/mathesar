<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import PermissionsModalContent from './PermissionsModalContent.svelte';
  import type { PermissionsAsyncStores } from './permissionsUtils';

  type Privilege = $$Generic;

  interface $$Slots {
    title: Record<never, never>;
    share: {
      asyncStores: PermissionsAsyncStores<Privilege, string>;
    };
    'transfer-ownership': {
      asyncStores: PermissionsAsyncStores<Privilege, string>;
    };
  }

  export let controller: ModalController;
  export let getAsyncStores: () => PermissionsAsyncStores<Privilege>;
  export let onClose: () => void = () => {};
</script>

<ControlledModal {controller} on:close={() => onClose()}>
  <slot name="title" slot="title" />

  <PermissionsModalContent {getAsyncStores}>
    <slot slot="share" name="share" let:asyncStores {asyncStores} />
    <slot
      slot="transfer-ownership"
      name="transfer-ownership"
      let:asyncStores
      {asyncStores}
    />
  </PermissionsModalContent>
</ControlledModal>
