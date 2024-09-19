<script lang="ts">
  import { _ } from 'svelte-i18n';

  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';

  import PermissionsModalContent from './PermissionsModalContent.svelte';
  import type {
    PermissionsAsyncStores,
    PermissionsModalSlots,
  } from './permissionsUtils';

  type Privilege = $$Generic;
  interface $$Slots extends PermissionsModalSlots<Privilege> {
    title: Record<never, never>;
  }

  export let controller: ModalController;
  export let getAsyncStores: () => PermissionsAsyncStores<Privilege>;
  export let onClose: () => void = () => {};
</script>

<ControlledModal {controller} on:close={() => onClose()}>
  <slot name="title" slot="title" />

  <PermissionsModalContent {getAsyncStores}>
    <slot slot="share" name="share" let:storeValues {storeValues} />
    <slot
      slot="transfer-ownership"
      name="transfer-ownership"
      let:storeValues
      {storeValues}
    />
  </PermissionsModalContent>
</ControlledModal>
