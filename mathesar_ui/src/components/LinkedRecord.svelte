<script lang="ts">
  import { faExternalLinkAlt } from '@fortawesome/free-solid-svg-icons';
  import { Icon } from '@mathesar/component-library';

  export let primaryKeyCellValue: unknown;
  export let label: string | undefined = undefined;
  export let showLink = false;
</script>

<span class="linked-record">
  {#if label !== undefined}
    {label}
  {:else}
    {String(primaryKeyCellValue)}
  {/if}
  {#if showLink}
    <!-- TODO link to Record Page -->
    <a class="record-page-icon-link" href="#" title="Open Record">
      <Icon data={faExternalLinkAlt} />
    </a>
  {/if}
</span>

<style>
  .linked-record {
    background: var(--color-fk);
    padding: 0.2em 0.4em;
    border-radius: 0.2em;
  }
  .record-page-icon-link {
    margin-left: 0.3em;
    color: black;
  }
</style>
