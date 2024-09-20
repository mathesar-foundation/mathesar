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
    <!--
      -- `<slot name="share" let:storeValues {storeValues} />` seems
      -- to result in a error when performing typecheck even though
      -- it works.
    -->
    <svelte:fragment slot="share" let:storeValues>
      <slot name="share" {storeValues} />
    </svelte:fragment>
    <svelte:fragment slot="transfer-ownership" let:storeValues>
      <slot name="transfer-ownership" {storeValues} />
    </svelte:fragment>
  </PermissionsModalContent>
</ControlledModal>
