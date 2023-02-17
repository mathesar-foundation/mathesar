<script lang="ts">
  import {
    ControlledModal,
    type ModalController,
  } from '@mathesar-component-library';
  import type { Database } from '@mathesar/AppTypes';
  import Identifier from '@mathesar/components/Identifier.svelte';
  import DbAccessControlView from './DbAccessControlView.svelte';

  export let controller: ModalController;
  export let database: Database;
</script>

<ControlledModal {controller} closeOn={['button', 'esc', 'overlay']}>
  <svelte:fragment slot="title">
    Manage <Identifier>{database.name}</Identifier> Database Access
  </svelte:fragment>

  <DbAccessControlView {database} />
</ControlledModal>
