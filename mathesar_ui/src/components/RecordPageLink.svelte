<script lang="ts">
  import { _ } from 'svelte-i18n';

  import { iconLinkToRecordPage } from '@mathesar/icons';
  import { Icon } from '@mathesar-component-library';

  export let href: string;

  function handleContextMenu(e: Event) {
    // We stop propagating this event so that when a RecordPageLink is embedded
    // within a cell, the user can open the _browser_ context menu on the link
    // while still being able to open the _Mathesar_ context menu on the rest of
    // the cell.
    e.stopPropagation();
  }
</script>

<a
  {href}
  class="record-page-link"
  title={$_('open_record')}
  on:contextmenu={handleContextMenu}
>
  <Icon {...iconLinkToRecordPage} />
</a>

<style>
  .record-page-link {
    color: var(--neutral-300);
  }
  .record-page-link:hover {
    color: var(--neutral-800);
  }
</style>
